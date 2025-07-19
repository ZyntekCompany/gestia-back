import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';

@Injectable()
export class GetEntityKpisUseCase {
  constructor(private prisma: PrismaService) {}

  async execute(userId: string, startDate?: string, endDate?: string) {
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new Error('Usuario no encontrado');

    // ADMIN: KPIs de la entidad, OFFICER: KPIs del área
    const requestWhere: { [key: string]: any } = {};
    const userWhere: { [key: string]: any } = { active: true };

    if (user.role === 'ADMIN') {
      if (!user.entityId) throw new Error('Entidad no encontrada');
      requestWhere.entityId = user.entityId;
      userWhere.entityId = user.entityId;
    } else {
      throw new ForbiddenException(
        'Solo los administradores pueden acceder a los KPIs de la entidad',
      );
    }

    if (startDate || endDate) {
      requestWhere.createdAt = dateFilter;
      userWhere.updatedAt = dateFilter;
    }

    // Total de solicitudes
    const totalRequests = await this.prisma.request.count({
      where: requestWhere,
    });

    // Solicitudes resueltas
    const resolvedRequests = await this.prisma.request.count({
      where: { ...requestWhere, status: 'COMPLETED' },
    });

    // Tiempo promedio de respuesta (en días)
    const requests = await this.prisma.request.findMany({
      where: { ...requestWhere, status: 'COMPLETED' },
      select: { createdAt: true, updatedAt: true },
    });
    let avgResponseTime = 0;
    if (requests.length > 0) {
      const totalDays = requests.reduce((acc, req) => {
        const diff =
          (req.updatedAt.getTime() - req.createdAt.getTime()) /
          (1000 * 60 * 60 * 24);
        return acc + diff;
      }, 0);
      avgResponseTime = totalDays / requests.length;
    }

    // Usuarios activos
    const activeUsers = await this.prisma.user.count({
      where: userWhere,
    });

    return {
      totalRequests,
      resolvedRequests,
      avgResponseTime: Number(avgResponseTime.toFixed(2)),
      activeUsers,
    };
  }
}
