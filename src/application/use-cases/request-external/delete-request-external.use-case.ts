import { Injectable, Inject } from '@nestjs/common';
import { RequestExternalRepository } from 'src/domain/repositories/request-external.repository';

@Injectable()
export class DeleteRequestExternalUseCase {
  constructor(
    @Inject('RequestExternalRepository')
    private readonly requestExternalRepository: RequestExternalRepository,
  ) {}

  async execute(id: string): Promise<void> {
    return this.requestExternalRepository.delete(id);
  }
}
