import { Module } from '@nestjs/common';
import { GatewaysModule } from 'src/module/core/request-gateway.module';
import { IaUseCase } from 'src/application/use-cases/ia/ia.use-case';
import { FindHistoryUseCase } from 'src/application/use-cases/request/find-history.usecase';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { PrismaRequestRepository } from 'src/infrastructure/repositories/prisma-request.repository';
import { IaController } from 'src/interfaces/controllers/ia.controller';
import { GeminiService } from 'src/infrastructure/services/gemini.service';

@Module({
  imports: [GatewaysModule],
  controllers: [IaController],
  providers: [
    IaUseCase,
    PrismaService,
    FindHistoryUseCase,
    PrismaRequestRepository,
    GeminiService,
    { provide: 'RequestRepository', useClass: PrismaRequestRepository },
  ],
  exports: [PrismaRequestRepository],
})
export class IaModule {}
