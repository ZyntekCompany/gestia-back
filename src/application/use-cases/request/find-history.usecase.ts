import { Inject, Injectable } from '@nestjs/common';
import { RequestRepository } from 'src/domain/repositories/request.repository';

@Injectable()
export class FindHistoryUseCase {
  constructor(
    @Inject('RequestRepository') private readonly repo: RequestRepository,
  ) {}
  async execute(requestId: string, readerUserId?: string) {
    return this.repo.findHistory(requestId, readerUserId);
  }
}
