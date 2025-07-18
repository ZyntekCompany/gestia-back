import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateRequestExternalDto } from 'src/interfaces/dtos/request-external.dto';
import { JwtPayload } from 'src/types/express';
import { Request } from 'express';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { S3Service } from 'src/infrastructure/services/s3/s3.service';
import { RequestStatus } from '@prisma/client';
import { InputJsonValue } from '@prisma/client/runtime/library';

@Injectable()
export class CreateRequestExternalUseCase {
  constructor(
    private readonly s3Service: S3Service,
    private readonly prisma: PrismaService,
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
    if (!userId) throw new BadRequestException('Usuario no autenticado');

    const { addDays } = await import('date-fns');
    const deadline = addDays(new Date(), dto.maxResponseDays);

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
      userId,
      mailrecipient: dto.mailrecipient,
      maxResponseDays: dto.maxResponseDays,
      subject: dto.subject,
      content,
      status: RequestStatus.PENDING,
      entityId: dto.entityId,
      deadline,
    };

    const request = await this.prisma.requestExternal.create({
      data: newRequestData,
    });

    const documents: any[] = [];
    if (files && files.length) {
      for (const file of files) {
        const url = await this.s3Service.uploadFile(file);
        const doc = await this.prisma.document.create({
          data: {
            name: file.originalname,
            url,
            requestExternalId: request.id,
            requestId: '', // Valor dummy, pero cumple con el tipo
          },
        });
        documents.push(doc);
      }
    }

    return { request, documents };
  }
}
