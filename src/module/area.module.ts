// src/infrastructure/modules/area.module.ts
import { Module } from '@nestjs/common';
import { CreateAreaUseCase } from 'src/application/use-cases/area/area.use-case';
import { PrismaAreaRepository } from 'src/infrastructure/repositories/prisma-area.repositorio';
import { AreaController } from 'src/interfaces/controllers/area.controller';

@Module({
  controllers: [AreaController],
  providers: [
    CreateAreaUseCase,
    { provide: 'AreaRepository', useClass: PrismaAreaRepository },
  ],
  exports: [{ provide: 'AreaRepository', useClass: PrismaAreaRepository }],
})
export class AreaModule {}
