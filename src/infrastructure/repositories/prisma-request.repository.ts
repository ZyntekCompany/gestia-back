// prisma-request.repository.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestRepository } from 'src/domain/repositories/request.repository';
import { AssignAreaDto } from 'src/interfaces/dtos/request.dto';
import { RequestEntity } from 'src/domain/entities/request.entity';

@Injectable()
export class PrismaRequestRepository implements RequestRepository {
  constructor(private readonly prisma: PrismaService) {}

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

  async findHistory(id: string, readerUserId?: string): Promise<any[]> {
    // Marca como leídos todos los mensajes que no fueron escritos por el que consulta
    if (readerUserId) {
      await this.prisma.requestUpdate.updateMany({
        where: {
          requestId: id,
          isRead: false,
          NOT: { updatedById: readerUserId },
        },
        data: { isRead: true },
      });
    }

    // Devuelve historial completo y ordenado DESC (más nuevo primero)
    return this.prisma.requestUpdate.findMany({
      where: { requestId: id },
      orderBy: { createdAt: 'desc' }, // ← Cambia aquí a descendente
      include: {
        // Datos completos del usuario que realizó el update
        updatedBy: true,
        // Documentos asociados a este update
        Document: true,
        // Puedes incluir áreas si quieres mostrar los nombres de área en cambios de área
        fromArea: { select: { id: true, name: true } },
        toArea: { select: { id: true, name: true } },
      },
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

  async completeRequest(requestId: string, userId: string): Promise<void> {
    // Cambia el estado a COMPLETED
    await this.prisma.request.update({
      where: { id: requestId },
      data: { status: 'COMPLETED' },
    });

    // Crea un update de tipo CLOSED
    await this.prisma.requestUpdate.create({
      data: {
        requestId,
        updatedById: userId,
        type: 'CLOSED',
        message: 'Solicitud marcada como completada y cerrada.',
      },
    });
  }
}
