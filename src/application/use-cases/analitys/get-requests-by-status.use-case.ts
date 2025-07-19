import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { RequestStatus } from '@prisma/client';

const statusMap: Record<RequestStatus, string> = {
  PENDING: 'Pendientes',
  IN_REVIEW: 'En Revisión',
  COMPLETED: 'Completadas',
  OVERDUE: 'Vencidas',
};

const allStatuses = Object.keys(statusMap) as RequestStatus[];

@Injectable()
export class GetRequestsByStatusUseCase {
  constructor(private prisma: PrismaService) {}

  async execute(userId: string) {
    // Busca el usuario y valida que sea ADMIN
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'ADMIN' || !user.entityId) {
      throw new ForbiddenException(
        'Solo los administradores pueden acceder a esta información',
      );
    }

    // Cuenta las solicitudes por estado
    const counts = await Promise.all(
      allStatuses.map(async (status) => {
        const value = await this.prisma.request.count({
          where: {
            entityId: user.entityId!,
            status: status,
          },
        });
        return {
          status: statusMap[status],
          value,
        };
      }),
    );

    return counts;
  }
}
