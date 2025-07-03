import { Inject, Injectable } from '@nestjs/common';
import { ProcedureRepository } from 'src/domain/repositories/procedure.repository';

@Injectable()
export class DeleteProcedureUseCase {
  constructor(
    @Inject('ProcedureRepository')
    private readonly procedureRepository: ProcedureRepository,
  ) {}

  async execute(id: string): Promise<void> {
    await this.procedureRepository.deleteProcedure(id);
  }
}
