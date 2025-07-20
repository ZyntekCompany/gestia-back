import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { EmailService } from './email.service';

interface RequestWithRelations {
  id: string;
  radicado: string | null;
  subject: string;
  deadline: Date;
  assignedTo: {
    id: string;
    email: string;
    fullName: string;
  } | null;
  citizen: {
    id: string;
    fullName: string;
  };
  procedure: {
    id: string;
    name: string;
  };
  entity: {
    id: string;
    name: string;
  };
}

@Injectable()
export class OverdueCronService {
  private readonly logger = new Logger(OverdueCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject('EmailService') private readonly emailService: EmailService,
  ) {}

  // Corre todos los días a las 12:00 AM
  @Cron('0 0 * * *') // cron estándar: minuto hora día-mes mes día-semana
  async handleOverdueRequests() {
    const now = new Date();

    // 1. Actualizar solicitudes vencidas
    const overdueRequests = await this.prisma.request.findMany({
      where: {
        status: { in: ['PENDING', 'IN_REVIEW'] },
        deadline: { lt: now },
      },
      include: {
        assignedTo: true,
        citizen: true,
        procedure: true,
        entity: true,
      },
    });

    if (overdueRequests.length > 0) {
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
    } else {
      this.logger.log('No hay solicitudes vencidas para actualizar.');
    }

    // 2. Enviar alertas de solicitudes que vencen en 1 día
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999); // Fin del día siguiente

    const requestsExpiringTomorrow = await this.prisma.request.findMany({
      where: {
        status: { in: ['PENDING', 'IN_REVIEW'] },
        deadline: {
          gte: new Date(tomorrow.getTime() - 24 * 60 * 60 * 1000), // Inicio del día siguiente
          lte: tomorrow, // Fin del día siguiente
        },
      },
      include: {
        assignedTo: true,
        citizen: true,
        procedure: true,
        entity: true,
      },
    });

    if (requestsExpiringTomorrow.length > 0) {
      await this.sendExpirationAlerts(
        requestsExpiringTomorrow as RequestWithRelations[],
      );
      this.logger.log(
        `Se enviaron alertas para ${requestsExpiringTomorrow.length} solicitudes que vencen mañana.`,
      );
    } else {
      this.logger.log('No hay solicitudes que venzan mañana.');
    }
  }

  private async sendExpirationAlerts(requests: RequestWithRelations[]) {
    for (const request of requests) {
      if (request.assignedTo) {
        try {
          await this.emailService.sendEmail({
            to: [
              {
                email: request.assignedTo.email,
                name: request.assignedTo.fullName,
              },
            ],
            subject: `⚠️ ALERTA: Solicitud vence mañana - ${request.radicado || request.id}`,
            htmlContent: `
              <h2>Alerta de Vencimiento</h2>
              <p><strong>Estimado/a ${request.assignedTo.fullName},</strong></p>
              
              <p>Le informamos que la siguiente solicitud vence <strong>mañana</strong>:</p>
              
              <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p><strong>Radicado:</strong> ${request.radicado || 'Sin radicado'}</p>
                <p><strong>Asunto:</strong> ${request.subject}</p>
                <p><strong>Solicitante:</strong> ${request.citizen.fullName}</p>
                <p><strong>Procedimiento:</strong> ${request.procedure.name}</p>
                <p><strong>Entidad:</strong> ${request.entity.name}</p>
                <p><strong>Fecha de vencimiento:</strong> ${request.deadline.toLocaleDateString('es-ES')}</p>
              </div>
              
              <p>Por favor, tome las acciones necesarias para completar esta solicitud antes de su vencimiento.</p>
              
              <p>Saludos cordiales,<br>
              Sistema de Gestión de Correspondencia</p>
            `,
          });
        } catch (error) {
          this.logger.error(
            `Error enviando alerta de vencimiento para solicitud ${request.id}: ${error}`,
          );
        }
      }
    }
  }
}
