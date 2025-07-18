import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InputJsonValue } from '@prisma/client/runtime/library';
import { Request } from 'express';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { S3Service } from 'src/infrastructure/services/s3/s3.service';
import { RequestsGateway } from 'src/infrastructure/services/webSocket-gateway.service';
import { CreateRequestDto } from 'src/interfaces/dtos/request.dto';
import { JwtPayload } from 'src/types/express';
import { EmailService } from 'src/infrastructure/services/email.service';

function hasTexto(obj: unknown): obj is { texto: string } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    // El siguiente cast es seguro porque ya verificamos que es objeto y no null
    typeof (obj as Record<string, unknown>).texto === 'string'
  );
}

@Injectable()
export class CreateRequesUseCase {
  constructor(
    private readonly s3Service: S3Service,
    private readonly prisma: PrismaService,
    private readonly gateway: RequestsGateway,
    @Inject('EmailService') private readonly emailService: EmailService,
  ) {}

  async create(
    dto: CreateRequestDto,
    req: Request,
    files: Express.Multer.File[],
  ) {
    let content = dto.content;
    if (typeof content === 'string') {
      try {
        content = JSON.parse(content) as unknown as InputJsonValue;
      } catch {
        throw new BadRequestException('El campo content debe ser JSON válido');
      }
    }

    const userId = (req.user as JwtPayload | undefined)?.sub;
    if (!userId) throw new BadRequestException('Usuario no autenticado');

    const procedure = await this.prisma.procedure.findUnique({
      where: { id: dto.procedureId },
      include: { area: true, entity: true },
    });

    if (!procedure || !procedure.areaId) {
      throw new BadRequestException('Trámite o área no encontrada');
    }

    const officers = await this.prisma.user.findMany({
      where: { areaId: procedure.areaId, active: true },
      orderBy: { createdAt: 'asc' },
    });
    if (!officers.length)
      throw new BadRequestException(
        'No hay funcionarios disponibles en el área',
      );

    const area = await this.prisma.area.findUnique({
      where: { id: procedure.areaId },
    });
    const nextIndex = (area?.lastAssignedIndex || 0) % officers.length;
    const assignedOfficer = officers[nextIndex];

    const { addDays } = await import('date-fns');
    const deadline = addDays(new Date(), procedure.maxResponseDays);

    // Para el radicado de Request
    const lastRequest = await this.prisma.request.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    let nextRequestNumber = 1;
    if (
      lastRequest &&
      typeof lastRequest.radicado === 'string' &&
      /^RAD-\d+$/.test(String(lastRequest.radicado))
    ) {
      nextRequestNumber =
        parseInt(String(lastRequest.radicado).replace('RAD-', ''), 10) + 1;
    }
    const radicado = `RAD-${nextRequestNumber.toString().padStart(5, '0')}`;

    // Para el radicado de RequestUpdate
    const lastUpdate = await this.prisma.requestUpdate.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    let nextUpdateNumber = 1;
    if (
      lastUpdate &&
      typeof lastUpdate.radicado === 'string' &&
      /^UPD-\d+$/.test(String(lastUpdate.radicado))
    ) {
      nextUpdateNumber =
        parseInt(String(lastUpdate.radicado).replace('UPD-', ''), 10) + 1;
    }
    const radicadoUpdate = `UPD-${nextUpdateNumber.toString().padStart(5, '0')}`;

    const request = await this.prisma.request.create({
      data: {
        radicado: radicado,
        subject: dto.subject,
        content: content,
        status: 'PENDING',
        procedureId: dto.procedureId,
        citizenId: userId,
        assignedToId: assignedOfficer.id,
        entityId: procedure.entityId,
        currentAreaId: procedure.areaId,
        deadline,
      },
    });

    const procedurePQRS = await this.prisma.request.findFirst({
      where: {
        id: request.id,
      },
      include: {
        procedure: true,
      },
    });

    await this.prisma.area.update({
      where: { id: area?.id },
      data: { lastAssignedIndex: nextIndex + 1 },
    });

    await this.prisma.requestUpdate.create({
      data: {
        radicado: radicadoUpdate,
        requestId: request.id,
        updatedById: assignedOfficer.id,
        type: 'ASSIGNED',
        toAreaId: procedure.areaId,
        toUserId: assignedOfficer.id,
        message: 'Solicitud Asignada al Funcionario.',
      },
    });

    // Procesar archivos adjuntos
    const documents: { name: string; url: string }[] = [];
    if (files && files.length) {
      for (const file of files) {
        const url = await this.s3Service.uploadFile(file);
        const doc = await this.prisma.document.create({
          data: {
            name: file.originalname,
            url,
            requestId: request.id,
          },
        });
        documents.push(doc);
      }
    }

    this.gateway.emitNewRequest(request.entityId, request);

    // Buscar datos del ciudadano y entidad para el correo
    const citizen = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    const entity = await this.prisma.entity.findUnique({
      where: { id: request.entityId },
    });
    await this.sendCitizenRequestEmail(
      citizen?.email ?? '',
      citizen?.fullName ?? '',
      request.subject,
      request.content,
      documents,
      entity?.imgUrl ?? '',
      entity?.name ?? '',
    );

    return { procedurePQRS, request, documents };
  }

  private async sendCitizenRequestEmail(
    toEmail: string,
    fullName: string,
    subject: string,
    content: any,
    documents: { name: string; url: string }[],
    entityLogo: string,
    entityName: string,
  ) {
    let docsHtml = '';
    if (documents.length) {
      docsHtml = documents
        .map(
          (doc) => `
            <a href="${doc.url}" style="display:flex;align-items:center;padding:10px 16px;background:#fff;border:1px solid #e2e8f0;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.04);color:#222;text-decoration:none;font-weight:500;margin-bottom:10px;max-width:340px;">
              <span style="display:inline-block;margin-right:10px;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="24" height="24" rx="4" fill="#e53e3e"/>
                  <text x="12" y="16" text-anchor="middle" fill="#fff" font-size="10" font-family="Arial" font-weight="bold">PDF</text>
                </svg>
              </span>
              <span style="color:#222;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${doc.name}</span>
            </a>
          `,
        )
        .join('');
    }
    // Formatear el contenido si es objeto con campo texto
    let contentHtml = '';
    if (typeof content === 'string') {
      contentHtml = content;
    } else if (hasTexto(content)) {
      contentHtml = content.texto;
    } else {
      contentHtml = '';
    }
    const htmlContent = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,0.05);padding:32px;">
        <div style="text-align:center;margin-bottom:24px;">
          <img src="${entityLogo}" alt="Logo entidad" style="max-width:120px;margin-bottom:8px;" />
          <h2 style="margin:0;font-size:24px;color:#222;">${entityName}</h2>
        </div>
        <h3 style="color:#222;font-size:20px;margin-bottom:8px;">${subject}</h3>
        <div style="color:#444;font-size:16px;margin-bottom:16px;white-space:pre-line;">${contentHtml}</div>
        ${docsHtml ? `<div style='margin-top:18px;'><b style='color:#222;'>Documentos adjuntos:</b><div>${docsHtml}</div></div>` : ''}
        <div style="margin-top:32px;font-size:13px;color:#888;text-align:center;">Este es un mensaje automático de Gestia.</div>
      </div>
    `;
    await this.emailService.sendEmail({
      to: [{ email: toEmail, name: fullName }],
      subject: `Nueva solicitud: ${subject}`,
      htmlContent,
    });
  }
}
