import { Injectable, Inject } from '@nestjs/common';
import { RequestExternalRepository } from 'src/domain/repositories/request-external.repository';
import { RequestExternalEntity } from 'src/domain/entities/request-external.entity';

@Injectable()
export class FindOneRequestExternalUseCase {
  constructor(
    @Inject('RequestExternalRepository')
    private readonly requestExternalRepository: RequestExternalRepository,
  ) {}

  async execute(id: string): Promise<RequestExternalEntity | null> {
    return this.requestExternalRepository.findById(id);
  }
}
