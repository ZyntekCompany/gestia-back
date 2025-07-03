import { Inject, Injectable } from '@nestjs/common';
import { RequestRepository } from 'src/domain/repositories/request.repository';
import { RespondRequestDto } from 'src/interfaces/dtos/request.dto';

@Injectable()
export class RespondRequestUseCase {
  constructor(
    @Inject('RequestRepository') private readonly repo: RequestRepository,
  ) {}
  async execute(
    requestId: string,
    userId: string,
    role: string,
    dto: RespondRequestDto,
  ) {
    return this.repo.respondToRequest(requestId, userId, role, dto);
  }
}
