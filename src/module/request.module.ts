// src/infrastructure/modules/request.module.ts
import { Module } from '@nestjs/common';
import { AssignAreaUseCase } from 'src/application/use-cases/request/assign-area.use-case';
import { CreateRequesUseCase } from 'src/application/use-cases/request/created-request.use-case';
import { FindHistoryUseCase } from 'src/application/use-cases/request/find-history.usecase';
import { RequesReplyUseCase } from 'src/application/use-cases/request/request-reply.use-case';
import { FindUnifiedRequestsUseCase } from 'src/application/use-cases/request/find-unified-requests.use-case';
import { GenerateExcelReportUseCase } from 'src/application/use-cases/request/generate-excel-report.use-case';
import { PrismaRequestRepository } from 'src/infrastructure/repositories/prisma-request.repository';
import { OverdueCronService } from 'src/infrastructure/services/overdue-cron.service';
import { RequestController } from 'src/interfaces/controllers/request.controller';
import { GatewaysModule } from './core/request-gateway.module';
import { BrevoEmailService } from 'src/infrastructure/services/brevo-email.service';

@Module({
  imports: [GatewaysModule],
  controllers: [RequestController],
  providers: [
    OverdueCronService,
    AssignAreaUseCase,
    FindHistoryUseCase,
    CreateRequesUseCase,
    RequesReplyUseCase,
    FindUnifiedRequestsUseCase,
    GenerateExcelReportUseCase,
    PrismaRequestRepository,
    {
      provide: 'EmailService',
      useClass: BrevoEmailService,
    },
    { provide: 'RequestRepository', useClass: PrismaRequestRepository },
  ],
  exports: [
    PrismaRequestRepository,
    { provide: 'RequestRepository', useClass: PrismaRequestRepository },
  ],
})
export class RequestModule {}
