import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { UnifiedRequestsFilterDto } from 'src/interfaces/dtos/request.dto';

@Injectable()
export class FindUnifiedRequestsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(filters: UnifiedRequestsFilterDto, userId: string) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;

    // Obtener la entidad del usuario
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { entityId: true },
    });

    if (!user?.entityId) {
      throw new Error('Usuario no tiene entidad asignada');
    }

    // Construir filtros para Request
    const requestWhere: Record<string, any> = {
      entityId: user.entityId, // Filtrar por entidad del usuario
    };
    if (filters.radicado) {
      requestWhere.radicado = {
        contains: filters.radicado,
        mode: 'insensitive',
      };
    }
    if (filters.subject) {
      requestWhere.subject = { contains: filters.subject, mode: 'insensitive' };
    }
    if (filters.status) {
      requestWhere.status = filters.status;
    }
    // Si no se especifican fechas, usar el mes actual
    if (!filters.startDate && !filters.endDate) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );

      requestWhere.createdAt = {
        gte: startOfMonth,
        lte: endOfMonth,
      };
    } else if (filters.startDate || filters.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (filters.startDate) {
        dateFilter.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        dateFilter.lte = new Date(filters.endDate + 'T23:59:59.999Z');
      }
      requestWhere.createdAt = dateFilter;
    }

    // Construir filtros para RequestExternal
    const requestExternalWhere: Record<string, any> = {
      entityId: user.entityId, // Filtrar por entidad del usuario
    };
    if (filters.radicado) {
      requestExternalWhere.radicado = {
        contains: filters.radicado,
        mode: 'insensitive',
      };
    }
    if (filters.subject) {
      requestExternalWhere.subject = {
        contains: filters.subject,
        mode: 'insensitive',
      };
    }
    if (filters.status) {
      requestExternalWhere.status = filters.status;
    }
    // Si no se especifican fechas, usar el mes actual
    if (!filters.startDate && !filters.endDate) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );

      requestExternalWhere.createdAt = {
        gte: startOfMonth,
        lte: endOfMonth,
      };
    } else if (filters.startDate || filters.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (filters.startDate) {
        dateFilter.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        dateFilter.lte = new Date(filters.endDate + 'T23:59:59.999Z');
      }
      requestExternalWhere.createdAt = dateFilter;
    }

    let internalRequests: Record<string, any>[] = [];
    let externalRequests: Record<string, any>[] = [];
    let internalTotal = 0;
    let externalTotal = 0;

    // Si no se especifica tipo o es internal, buscar requests internas
    if (!filters.type || filters.type === 'internal') {
      const [internalCount, internalData] = await Promise.all([
        this.prisma.request.count({ where: requestWhere }),
        this.prisma.request.findMany({
          where: requestWhere,
          orderBy: { createdAt: 'desc' },
          include: {
            citizen: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
            assignedTo: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
            procedure: {
              select: {
                id: true,
                name: true,
              },
            },
            entity: {
              select: {
                id: true,
                name: true,
              },
            },
            currentArea: {
              select: {
                id: true,
                name: true,
              },
            },
            Document: true,
          },
        }),
      ]);

      internalTotal = internalCount;
      internalRequests = internalData.map((req) => ({
        ...req,
        type: 'internal',
      }));
    }

    // Si no se especifica tipo o es external, buscar requests externas
    if (!filters.type || filters.type === 'external') {
      const [externalCount, externalData] = await Promise.all([
        this.prisma.requestExternal.count({ where: requestExternalWhere }),
        this.prisma.requestExternal.findMany({
          where: requestExternalWhere,
          orderBy: { createdAt: 'desc' },
          include: {
            User: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
            Document: true,
          },
        }),
      ]);

      externalTotal = externalCount;
      externalRequests = externalData.map((req) => ({
        ...req,
        type: 'external',
      }));
    }

    // Combinar y ordenar resultados
    const allRequests = [...internalRequests, ...externalRequests];
    allRequests.sort(
      (a, b) =>
        new Date(b.createdAt as string).getTime() -
        new Date(a.createdAt as string).getTime(),
    );

    // Aplicar paginación a los resultados combinados
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRequests = allRequests.slice(startIndex, endIndex);
    const total = internalTotal + externalTotal;

    return {
      data: paginatedRequests,
      total,
      page,
      pageCount: Math.ceil(total / limit),
      limit,
    };
  }
}
