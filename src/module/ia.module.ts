import { Module } from '@nestjs/common';
import { IaUseCase } from 'src/application/use-cases/ia/ia.use-case';
import { FindHistoryUseCase } from 'src/application/use-cases/request/find-history.usecase';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { PrismaRequestRepository } from 'src/infrastructure/repositories/prisma-request.repository';
import { IaController } from 'src/interfaces/controllers/ia.controller';

@Module({
  controllers: [IaController],
  providers: [
    IaUseCase,
    PrismaService,
    FindHistoryUseCase,
    { provide: 'RequestRepository', useClass: PrismaRequestRepository },
  ],
})
export class IaModule {}
