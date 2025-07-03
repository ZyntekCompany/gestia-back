// prisma-request.repository.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { addDays } from 'date-fns';
import { RequestRepository } from 'src/domain/repositories/request.repository';
import {
  AssignAreaDto,
  CreateRequestDto,
  RespondRequestDto,
} from 'src/interfaces/dtos/request.dto';
import { RequestEntity } from 'src/domain/entities/request.entity';

@Injectable()
export class PrismaRequestRepository implements RequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createRequest(
    dto: CreateRequestDto,
    citizenId: string,
  ): Promise<RequestEntity> {
    const procedure = await this.prisma.procedure.findUnique({
      where: { id: dto.procedureId },
      include: { area: true, entity: true },
    });
    if (!procedure || !procedure.areaId)
      throw new NotFoundException('Trámite o área no encontrada');

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

    const deadline = addDays(new Date(), procedure.maxResponseDays);

    const created = await this.prisma.request.create({
      data: {
        subject: dto.subject,
        content: dto.content,
        status: 'ASSIGNED',
        procedureId: dto.procedureId,
        citizenId,
        assignedToId: assignedOfficer.id,
        entityId: procedure.entityId,
        currentAreaId: procedure.areaId,
        deadline,
      },
    });

    await this.prisma.area.update({
      where: { id: area?.id },
      data: { lastAssignedIndex: nextIndex + 1 },
    });

    await this.prisma.requestUpdate.create({
      data: {
        requestId: created.id,
        updatedById: assignedOfficer.id,
        type: 'ASSIGNED',
        toAreaId: procedure.areaId,
        toUserId: assignedOfficer.id,
        message: 'Solicitud asignada automáticamente.',
      },
    });

    return new RequestEntity({
      ...created,
      assignedToId: created.assignedToId ?? undefined,
      currentAreaId: created.currentAreaId ?? undefined,
    });
  }

  async assignArea(
    requestId: string,
    officerId: string,
    dto: AssignAreaDto,
  ): Promise<void> {
    // Encuentra funcionarios activos en el área destino
    const officers = await this.prisma.user.findMany({
      where: { areaId: dto.toAreaId, role: 'OFFICER', active: true },
      orderBy: { createdAt: 'asc' },
    });
    if (!officers.length)
      throw new BadRequestException('No hay funcionarios en esa área');

    const area = await this.prisma.area.findUnique({
      where: { id: dto.toAreaId },
    });
    const nextIndex = (area?.lastAssignedIndex || 0) % officers.length;
    const assignedOfficer = officers[nextIndex];

    // Actualiza la solicitud
    await this.prisma.request.update({
      where: { id: requestId },
      data: {
        currentAreaId: dto.toAreaId,
        assignedToId: assignedOfficer.id,
      },
    });

    await this.prisma.area.update({
      where: { id: area?.id },
      data: { lastAssignedIndex: nextIndex + 1 },
    });

    await this.prisma.requestUpdate.create({
      data: {
        requestId,
        updatedById: officerId,
        type: 'DERIVED',
        toAreaId: dto.toAreaId,
        toUserId: assignedOfficer.id,
        message: dto.message ?? 'Solicitud derivada',
      },
    });
  }

  async respondToRequest(
    requestId: string,
    userId: string,
    role: string,
    dto: RespondRequestDto,
  ): Promise<void> {
    const type = role === 'CITIZEN' ? 'USER_REPLY' : 'RESPONSE';
    await this.prisma.requestUpdate.create({
      data: {
        requestId,
        updatedById: userId,
        type,
        message: dto.message,
        data: dto.data,
      },
    });
  }
  async findHistory(id: string, readerUserId?: string): Promise<any[]> {
    // Marca como leídos todos los mensajes que no fueron escritos por el que consulta
    if (readerUserId) {
      await this.prisma.requestUpdate.updateMany({
        where: {
          requestId: id,
          isRead: false,
          // Solo los mensajes que NO escribió este usuario
          NOT: {
            updatedById: readerUserId,
          },
        },
        data: {
          isRead: true,
        },
      });
    }

    // Devuelve el historial actualizado
    return this.prisma.requestUpdate.findMany({
      where: { requestId: id },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(id: string): Promise<RequestEntity> {
    const request = await this.prisma.request.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Solicitud no encontrada');
    return new RequestEntity({
      ...request,
      assignedToId: request.assignedToId ?? undefined,
      currentAreaId: request.currentAreaId ?? undefined,
    });
  }
}
