import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { CreateRequestExternalDto } from 'src/interfaces/dtos/request-external.dto';
import { JwtPayload } from 'src/types/express';
import { Request } from 'express';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { S3Service } from 'src/infrastructure/services/s3/s3.service';
import { RequestStatus } from '@prisma/client';
import { InputJsonValue } from '@prisma/client/runtime/library';
import { EmailService } from 'src/infrastructure/services/email.service';

@Injectable()
export class CreateRequestExternalUseCase {
  constructor(
    private readonly s3Service: S3Service,
    private readonly prisma: PrismaService,
    @Inject('EmailService') private readonly emailService: EmailService,
  ) {}

  async execute(
    dto: CreateRequestExternalDto,
    req: Request,
    files: Express.Multer.File[],
  ) {
    // Convertir content a InputJsonValue para Prisma
    let content: InputJsonValue = dto.content;
    if (typeof content === 'string') {
      try {
        content = JSON.parse(content) as InputJsonValue;
      } catch {
        throw new BadRequestException('El campo content debe ser JSON válido');
      }
    }
    const userId = (req.user as JwtPayload | undefined)?.sub;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new BadRequestException('Usuario no autenticado');

    if (!user.entityId) {
      throw new BadRequestException('El usuario no tiene entidad asociada');
    }

    const { addDays } = await import('date-fns');
    const deadline = addDays(new Date(), Number(dto.maxResponseDays));

    const lastRequest = await this.prisma.requestExternal.findFirst({
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

    // Creamos el objeto plano para Prisma
    const newRequestData = {
      radicado,
      typeRequest: dto.typeRequest,
      recipient: dto.recipient,
      userId: user.id,
      mailrecipient: dto.mailrecipient,
      maxResponseDays: Number(dto.maxResponseDays),
      subject: dto.subject,
      content,
      status: RequestStatus.PENDING,
      entityId: user.entityId,
      deadline,
    };

    const request = await this.prisma.requestExternal.create({
      data: newRequestData,
    });

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

    const entity = await this.prisma.entity.findUnique({
      where: { id: user.entityId },
    });
    await this.sendExternalRequestEmail(
      user.email,
      user.fullName,
      request.subject,
      request.content,
      documents,
      entity?.imgUrl ?? '',
      entity?.name ?? '',
    );

    return { request, documents };
  }

  private async sendExternalRequestEmail(
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
    let contentHtml = '';
    if (typeof content === 'string') {
      contentHtml = content;
    } else if (content && typeof content === 'object' && 'texto' in content) {
      contentHtml = (content as { texto: string }).texto;
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
      subject: `Nueva solicitud externa: ${subject}`,
      htmlContent,
    });
  }
}
