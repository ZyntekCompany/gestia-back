import { Inject, Injectable } from '@nestjs/common';
import { RequestRepository } from 'src/domain/repositories/request.repository';
import { RequestsGateway } from 'src/infrastructure/services/webSocket-gateway.service';
import { AssignAreaDto } from 'src/interfaces/dtos/request.dto';

// assign-area.usecase.ts
@Injectable()
export class AssignAreaUseCase {
  constructor(
    @Inject('RequestRepository') private readonly repo: RequestRepository,
    private readonly gateway: RequestsGateway, // 👈 nuevo
  ) {}

  async execute(requestId: string, officerId: string, dto: AssignAreaDto) {
    await this.repo.assignArea(requestId, officerId, dto);

    this.gateway.emitRequestUpdate(requestId, {
      type: 'DERIVED',
      toAreaId: dto.toAreaId,
      message: dto.message ?? 'Solicitud derivada',
    });
  }
}
