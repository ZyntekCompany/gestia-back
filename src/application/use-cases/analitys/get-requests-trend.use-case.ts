import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

@Injectable()
export class GetRequestsTrendUseCase {
  constructor(private prisma: PrismaService) {}

  async execute(userId: string, from?: Date, to?: Date) {
    // Valida admin
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'ADMIN' || !user.entityId) {
      throw new ForbiddenException(
        'Solo los administradores pueden acceder a esta información',
      );
    }

    // Rango de fechas: últimos 30 días por defecto
    const end = to ? new Date(to) : new Date();
    const start = from ? new Date(from) : new Date(end);
    if (!from) start.setDate(end.getDate() - 29);

    // Obtiene todas las solicitudes del rango
    const allRequests = await this.prisma.request.findMany({
      where: {
        entityId: user.entityId,
        createdAt: {
          gte: new Date(start.setHours(0, 0, 0, 0)),
          lte: new Date(end.setHours(23, 59, 59, 999)),
        },
      },
      select: { createdAt: true },
    });

    // Agrupa manualmente por día
    const countsByDay: Record<string, number> = {};
    allRequests.forEach((r) => {
      const key = format(r.createdAt, 'yyyy-MM-dd');
      countsByDay[key] = (countsByDay[key] || 0) + 1;
    });

    // Mapea a un array de días (aunque no haya solicitudes ese día)
    const trend: { date: string; requests: number }[] = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const key = format(date, 'yyyy-MM-dd');
      const formatted = format(date, 'MMM dd', { locale: es });
      trend.push({
        date: formatted,
        requests: countsByDay[key] || 0,
      });
    }

    return trend;
  }
}
