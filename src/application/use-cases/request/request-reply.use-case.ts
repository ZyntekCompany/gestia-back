import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InputJsonValue } from '@prisma/client/runtime/library';
import { Request } from 'express';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { S3Service } from 'src/infrastructure/services/s3/s3.service';
import { RequestsGateway } from 'src/infrastructure/services/webSocket-gateway.service';
import { RespondRequestDto } from 'src/interfaces/dtos/request.dto';
import { JwtPayload } from 'src/types/express';
import { EmailService } from 'src/infrastructure/services/email.service';

@Injectable()
export class RequesReplyUseCase {
  constructor(
    private readonly s3Service: S3Service,
    private readonly prisma: PrismaService,
    private readonly gateway: RequestsGateway,
    @Inject('EmailService') private readonly emailService: EmailService,
  ) {}

  async create(
    id: string,
    dto: RespondRequestDto,
    req: Request,
    files: Express.Multer.File[],
  ) {
    const userId = (req.user as JwtPayload | undefined)?.sub;
    const userRole = (req.user as JwtPayload | undefined)?.role;
    if (!userId) throw new BadRequestException('Usuario no autenticado');

    const request = await this.prisma.request.findUnique({
      where: { id },
    });
    if (!request) throw new BadRequestException('Request no encontrada');

    const isOwner = request.citizenId === userId;
    const isAssignedOfficer = request.assignedToId === userId;
    const isOfficer =
      userRole === 'OFFICER' || userRole === 'ADMIN' || userRole === 'SUPER';
    if (!isOwner && !isAssignedOfficer && !isOfficer) {
      throw new BadRequestException('No autorizado para responder');
    }

    let data = dto.data;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data) as unknown as InputJsonValue;
      } catch {
        throw new BadRequestException('El campo data debe ser JSON válido');
      }
    }

    // Solo cambia a IN_REVIEW si responde un funcionario
    if (isOfficer) {
      await this.prisma.request.update({
        where: { id },
        data: { status: 'IN_REVIEW' },
      });
    }

    // Generar radicado para requestUpdate
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

    const respuesta = await this.prisma.requestUpdate.create({
      data: {
        radicado: radicadoUpdate,
        requestId: id,
        updatedById: userId,
        type: isOfficer ? 'RESPONSE' : 'USER_REPLY',
        message: dto.message,
        data: data,
      },
    });

    // Archivos adjuntos como respuesta
    const documents: { name: string; url: string }[] = [];
    if (files && files.length) {
      for (const file of files) {
        const url = await this.s3Service.uploadFile(file);
        const doc = await this.prisma.document.create({
          data: {
            name: file.originalname,
            url,
            requestId: id,
            requestUpdateId: respuesta.id, // <-- ¡Referencia a la respuesta!
          },
        });
        documents.push(doc);
      }
    }

    this.gateway.emitRequestUpdate(id, {
      status: isOfficer ? 'IN_REVIEW' : undefined,
      message: dto.message,
      from: userId,
    });

    // Enviar correo al ciudadano con el mismo diseño profesional
    // Buscar datos de la request original, usuario y entidad
    const originalRequest = await this.prisma.request.findUnique({
      where: { id },
      include: { citizen: true, entity: true },
    });
    if (originalRequest && originalRequest.citizen && originalRequest.entity) {
      // Determinar el contenido de la respuesta

      // Filtrar documentos por tipo
      const pdfDocs = documents.filter((doc) =>
        doc.name.toLowerCase().endsWith('.pdf'),
      );
      const imageDocs = documents.filter((doc) =>
        /\.(png|jpg|jpeg|gif)$/i.test(doc.name),
      );
      const otherDocs = documents.filter(
        (doc) =>
          !doc.name.toLowerCase().endsWith('.pdf') &&
          !/\.(png|jpg|jpeg|gif)$/i.test(doc.name),
      );
      // Formatear el contenido: IA o manual
      let contentHtml = '';
      if (hasTexto(dto.data) && dto.data.texto.trim()) {
        contentHtml = dto.data.texto.trim();
      } else if (
        dto.message &&
        typeof dto.message === 'string' &&
        dto.message.trim()
      ) {
        contentHtml = dto.message.trim();
      } else {
        contentHtml = '<i>Sin contenido de mensaje</i>';
      }
      // Log para depuración
      console.log(
        '[EMAIL GESTIA] Enviando correo a:',
        originalRequest.citizen.email,
        'con asunto:',
        originalRequest.subject,
        'y mensaje:',
        contentHtml,
      );

      await this.sendCitizenReplyEmail(
        originalRequest.citizen.email,
        originalRequest.citizen.fullName,
        originalRequest.subject,
        contentHtml,
        pdfDocs,
        imageDocs,
        otherDocs,
        originalRequest.entity.imgUrl,
        originalRequest.entity.name,
      );
    }

    return { success: true, documents };
  }

  private async sendCitizenReplyEmail(
    toEmail: string,
    fullName: string,
    subject: string,
    content: string,
    pdfDocs: { name: string; url: string }[],
    imageDocs: { name: string; url: string }[],
    otherDocs: { name: string; url: string }[],
    entityLogo: string,
    entityName: string,
  ) {
    let docsHtml = '';
    if (pdfDocs.length) {
      docsHtml += pdfDocs
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
    if (imageDocs.length) {
      docsHtml += imageDocs
        .map(
          (doc) => `
            <div style="display:flex;align-items:center;margin-bottom:10px;">
              <a href="${doc.url}" target="_blank" style="display:inline-block;margin-right:10px;">
                <img src="${doc.url}" alt="${doc.name}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;border:1px solid #e2e8f0;box-shadow:0 2px 8px rgba(0,0,0,0.04);" />
              </a>
              <a href="${doc.url}" download style="color:#2563eb;text-decoration:underline;font-size:15px;">${doc.name}</a>
            </div>
          `,
        )
        .join('');
    }
    if (otherDocs.length) {
      docsHtml += otherDocs
        .map(
          (doc) => `
            <a href="${doc.url}" style="display:flex;align-items:center;padding:10px 16px;background:#fff;border:1px solid #e2e8f0;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.04);color:#222;text-decoration:none;font-weight:500;margin-bottom:10px;max-width:340px;">
              <span style="display:inline-block;margin-right:10px;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="24" height="24" rx="4" fill="#3182ce"/>
                  <text x="12" y="16" text-anchor="middle" fill="#fff" font-size="10" font-family="Arial" font-weight="bold">DOC</text>
                </svg>
              </span>
              <span style="color:#222;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${doc.name}</span>
            </a>
          `,
        )
        .join('');
    }
    const htmlContent = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,0.05);padding:32px;">
        <div style="text-align:center;margin-bottom:24px;">
          <img src="${entityLogo}" alt="Logo entidad" style="max-width:120px;margin-bottom:8px;" />
          <h2 style="margin:0;font-size:24px;color:#222;">${entityName}</h2>
        </div>
        <h3 style="color:#222;font-size:20px;margin-bottom:8px;">${subject}</h3>
        <div style="color:#444;font-size:16px;margin-bottom:16px;white-space:pre-line;">${content}</div>
        ${docsHtml ? `<div style='margin-top:18px;'><b style='color:#222;'>Documentos adjuntos:</b><div>${docsHtml}</div></div>` : ''}
        <div style="margin-top:32px;font-size:13px;color:#888;text-align:center;">Este es un mensaje automático de Gestia.</div>
      </div>
    `;
    await this.emailService.sendEmail({
      to: [{ email: toEmail, name: fullName }],
      subject: `Respuesta a tu solicitud: ${subject}`,
      htmlContent,
    });
  }
}

function hasTexto(obj: unknown): obj is { texto: string } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as Record<string, unknown>).texto === 'string'
  );
}
