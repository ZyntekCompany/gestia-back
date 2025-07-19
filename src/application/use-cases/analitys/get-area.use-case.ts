import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@Injectable()
export class GetRequestsByAreaUseCase {
  constructor(private prisma: PrismaService) {}

  async execute(userId: string) {
    // Busca el usuario y valida que sea ADMIN
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'ADMIN' || !user.entityId) {
      throw new ForbiddenException(
        'Solo los administradores pueden acceder a esta información',
      );
    }

    // Busca las áreas y cuenta las solicitudes por área
    const areas = await this.prisma.area.findMany({
      where: { entityId: user.entityId },
      select: {
        name: true,
        Request: { select: { id: true } },
      },
    });

    // Formatea la respuesta
    return areas.map((area) => ({
      name: area.name,
      requests: area.Request.length,
    }));
  }
}
