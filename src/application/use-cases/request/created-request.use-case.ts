import { BadRequestException, Injectable } from '@nestjs/common';
import { InputJsonValue } from '@prisma/client/runtime/library';
import { Request } from 'express';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { S3Service } from 'src/infrastructure/services/s3/s3.service';
import { CreateRequestDto } from 'src/interfaces/dtos/request.dto';
import { JwtPayload } from 'src/types/express';

@Injectable()
export class CreateRequesUseCase {
  constructor(
    private readonly s3Service: S3Service,
    private readonly prisma: PrismaService,
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
      where: { areaId: procedure.areaId, role: 'OFFICER', active: true },
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

    const request = await this.prisma.request.create({
      data: {
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
        requestId: request.id,
        updatedById: assignedOfficer.id,
        type: 'ASSIGNED',
        toAreaId: procedure.areaId,
        toUserId: assignedOfficer.id,
        message: 'Solicitud asignada automáticamente.',
      },
    });

    // Procesar archivos adjuntos
    const documents: any[] = [];
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

    return { procedurePQRS, request, documents };
  }
}
