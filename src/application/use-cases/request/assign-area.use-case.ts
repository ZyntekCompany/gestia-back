import { Inject, Injectable } from '@nestjs/common';
import { RequestRepository } from 'src/domain/repositories/request.repository';
import { AssignAreaDto } from 'src/interfaces/dtos/request.dto';

// assign-area.usecase.ts
@Injectable()
export class AssignAreaUseCase {
  constructor(
    @Inject('RequestRepository') private readonly repo: RequestRepository,
  ) {}
  async execute(requestId: string, officerId: string, dto: AssignAreaDto) {
    return this.repo.assignArea(requestId, officerId, dto);
  }
}
