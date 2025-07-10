// src/infrastructure/modules/procedure.module.ts
import { Module } from '@nestjs/common';
import { CreateProcedureUseCase } from 'src/application/use-cases/procedure/create-procedure.use-case';
import { UpdateProcedureUseCase } from 'src/application/use-cases/procedure/update-procedure.use-case';
import { DeleteProcedureUseCase } from 'src/application/use-cases/procedure/delete-procedure.use-case';
import { PrismaProcedureRepository } from 'src/infrastructure/repositories/prisma-procedure.repository';
import { ProcedureController } from 'src/interfaces/controllers/procedure.controller';
import { ListProcedureByAreaUseCase } from 'src/application/use-cases/procedure/list-by-area.use-case';

@Module({
  controllers: [ProcedureController],
  providers: [
    CreateProcedureUseCase,
    UpdateProcedureUseCase,
    DeleteProcedureUseCase,
    ListProcedureByAreaUseCase,
    { provide: 'ProcedureRepository', useClass: PrismaProcedureRepository },
  ],
  exports: [
    { provide: 'ProcedureRepository', useClass: PrismaProcedureRepository },
  ],
})
export class ProcedureModule {}
