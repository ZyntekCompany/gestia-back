import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@Injectable()
export class OverdueCronService {
  private readonly logger = new Logger(OverdueCronService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Corre todos los días a las 12:00 AM
  @Cron('0 0 * * *') // cron estándar: minuto hora día-mes mes día-semana
  async handleOverdueRequests() {
    const now = new Date();
    // Busca todas las requests que deban estar vencidas pero no lo están
    const overdueRequests = await this.prisma.request.findMany({
      where: {
        status: { in: ['PENDING', 'IN_REVIEW'] },
        deadline: { lt: now },
      },
    });

    if (!overdueRequests.length) {
      this.logger.log('No hay solicitudes vencidas para actualizar.');
      return;
    }

    const updatePromises = overdueRequests.map((req) =>
      this.prisma.request.update({
        where: { id: req.id },
        data: { status: 'OVERDUE' },
      }),
    );

    await Promise.all(updatePromises);

    this.logger.log(
      `Se actualizaron ${overdueRequests.length} solicitudes a OVERDUE.`,
    );
  }
}
