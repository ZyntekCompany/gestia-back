
import { Module } from '@nestjs/common';
import { IaUseCase } from 'src/application/use-cases/ia/ia.use-case';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { IaController } from 'src/interfaces/controllers/ia.controller';

@Module({
  controllers: [IaController],
  providers: [IaUseCase, PrismaService],
})
export class IaModule {}
