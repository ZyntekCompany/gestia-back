// src/infrastructure/modules/request.module.ts
import { Module } from '@nestjs/common';
import { AssignAreaUseCase } from 'src/application/use-cases/request/assign-area.use-case';
import { CreateRequestUseCase } from 'src/application/use-cases/request/create-request.usecase';
import { FindHistoryUseCase } from 'src/application/use-cases/request/find-history.usecase';
import { RespondRequestUseCase } from 'src/application/use-cases/request/respond-request.usecase';
import { PrismaRequestRepository } from 'src/infrastructure/repositories/prisma-request.repository';
import { RequestsGateway } from 'src/infrastructure/services/webSocket-gateway.service';
import { RequestController } from 'src/interfaces/controllers/request.controller';

@Module({
  controllers: [RequestController],
  providers: [
    CreateRequestUseCase,
    AssignAreaUseCase,
    RespondRequestUseCase,
    FindHistoryUseCase,
    RequestsGateway,
    { provide: 'RequestRepository', useClass: PrismaRequestRepository },
  ],
  exports: [
    { provide: 'RequestRepository', useClass: PrismaRequestRepository },
  ],
})
export class RequestModule {}
