// src/application/use-cases/procedure/create-procedure.use-case.ts

import { Inject, Injectable } from '@nestjs/common';
import { ProcedureRepository } from 'src/domain/repositories/procedure.repository';
import {
  CreateProcedureRequestDto,
  CreateProcedureResponseDto,
} from 'src/interfaces/dtos/procedure.dto';
import { Procedure } from 'src/domain/entities/procedure';

@Injectable()
export class CreateProcedureUseCase {
  constructor(
    @Inject('ProcedureRepository')
    private readonly procedureRepository: ProcedureRepository,
  ) {}

  async execute(
    dto: CreateProcedureRequestDto,
  ): Promise<CreateProcedureResponseDto> {
    const procedure = Procedure.create(
      dto.name,
      dto.description ?? null,
      dto.maxResponseDays,
      dto.entityId,
      dto.areaId ?? null,
      dto.pqrsType ?? null,
    );
    const created = await this.procedureRepository.createProcedure(procedure);
    return {
      id: created.id,
      name: created.name,
      description: created.description ?? undefined,
      maxResponseDays: created.maxResponseDays,
      entityId: created.entityId,
      areaId: created.areaId ?? undefined,
      pqrsType: created.pqrsType ?? undefined,
    };
  }
}
