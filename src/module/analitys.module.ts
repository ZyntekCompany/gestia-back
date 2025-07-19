// src/infrastructure/modules/entity.module.ts
import { Module } from '@nestjs/common';
import { GetRequestsByAreaUseCase } from 'src/application/use-cases/analitys/get-area.use-case';
import { GetEntityKpisUseCase } from 'src/application/use-cases/analitys/get-kpis.use-case';
import { GetLatestActivitiesUseCase } from 'src/application/use-cases/analitys/get-latest-activities-use-case';
import { GetRequestsByStatusUseCase } from 'src/application/use-cases/analitys/get-requests-by-status.use-case';
import { GetRequestsTrendUseCase } from 'src/application/use-cases/analitys/get-requests-trend.use-case';
import { AnalitysController } from 'src/interfaces/controllers/analitys.controller';

@Module({
  controllers: [AnalitysController],
  providers: [
    GetEntityKpisUseCase,
    GetRequestsByAreaUseCase,
    GetRequestsByStatusUseCase,
    GetLatestActivitiesUseCase,
    GetRequestsTrendUseCase,
  ],
  exports: [],
})
export class AnalitysModule {}
