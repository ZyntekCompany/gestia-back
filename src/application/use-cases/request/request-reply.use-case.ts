import { BadRequestException, Injectable } from '@nestjs/common';
import { InputJsonValue } from '@prisma/client/runtime/library';
import { Request } from 'express';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { S3Service } from 'src/infrastructure/services/s3/s3.service';
import { RespondRequestDto } from 'src/interfaces/dtos/request.dto';
import { JwtPayload } from 'src/types/express';

@Injectable()
export class RequesReplyUseCase {
  constructor(
    private readonly s3Service: S3Service,
    private readonly prisma: PrismaService,
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

    const respuesta = await this.prisma.requestUpdate.create({
      data: {
        requestId: id,
        updatedById: userId,
        type: isOfficer ? 'RESPONSE' : 'USER_REPLY',
        message: dto.message,
        data: data,
      },
    });

    // Archivos adjuntos como respuesta
    const documents: any[] = [];
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
    return { success: true, documents };
  }
}
