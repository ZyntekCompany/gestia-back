// src/application/use-cases/procedure/update-procedure.use-case.ts
import { Inject, Injectable } from '@nestjs/common';
import { ProcedureRepository } from 'src/domain/repositories/procedure.repository';
import {
  UpdateProcedureRequestDto,
  CreateProcedureResponseDto,
} from 'src/interfaces/dtos/procedure.dto';

@Injectable()
export class UpdateProcedureUseCase {
  constructor(
    @Inject('ProcedureRepository')
    private readonly procedureRepository: ProcedureRepository,
  ) {}

  async execute(
    dto: UpdateProcedureRequestDto,
  ): Promise<CreateProcedureResponseDto> {
    const updated = await this.procedureRepository.updateProcedure(dto.id, dto);
    return {
      id: updated.id,
      name: updated.name,
      description: updated.description ?? undefined,
      maxResponseDays: updated.maxResponseDays,
      entityId: updated.entityId,
      areaId: updated.areaId ?? undefined,
    };
  }
}
