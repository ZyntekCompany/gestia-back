import { Inject, Injectable } from '@nestjs/common';
import { ProcedureRepository } from 'src/domain/repositories/procedure.repository';
import { Procedure } from 'src/domain/entities/procedure';

@Injectable()
export class ListProcedureByAreaUseCase {
  constructor(
    @Inject('ProcedureRepository')
    private readonly procedureRepo: ProcedureRepository,
  ) {}

  async execute(areaId: string): Promise<Procedure[]> {
    return this.procedureRepo.findByAreaId(areaId);
  }
}
