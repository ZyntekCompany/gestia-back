// src/request/use-cases/create-request.usecase.ts
import { Injectable, Inject } from '@nestjs/common';
import { RequestEntity } from 'src/domain/entities/request.entity';
import { RequestRepository } from 'src/domain/repositories/request.repository';
import { CreateRequestDto } from 'src/interfaces/dtos/request.dto';

@Injectable()
export class CreateRequestUseCase {
  constructor(
    @Inject('RequestRepository')
    private readonly requestRepo: RequestRepository,
  ) {}

  async execute(
    dto: CreateRequestDto,
    citizenId: string,
  ): Promise<RequestEntity> {
    return this.requestRepo.createRequest(dto, citizenId);
  }
}
