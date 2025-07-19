import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@Injectable()
export class GetLatestActivitiesUseCase {
  constructor(private prisma: PrismaService) {}

  async execute(userId: string) {
    // Valida admin
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'ADMIN' || !user.entityId) {
      throw new ForbiddenException(
        'Solo los administradores pueden acceder a esta información',
      );
    }

    // Últimas 5 solicitudes más recientemente modificadas (toda la info)
    const latestRequests = await this.prisma.request.findMany({
      where: { entityId: user.entityId },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    });

    return latestRequests;
  }
}
