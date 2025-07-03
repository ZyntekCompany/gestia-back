// src/application/use-cases/create-entity.use-case.ts
import { Inject, NotFoundException } from '@nestjs/common';
import { Area } from 'src/domain/entities/area';
import { AreaRepository } from 'src/domain/repositories/area.repository';
import {
  CreateAreaRequestDto,
  CreateAreaResponseDto,
  UpdateAreaRequestDto,
} from 'src/interfaces/dtos/area.dto';

export class CreateAreaUseCase {
  constructor(
    @Inject('AreaRepository') private readonly areaRepository: AreaRepository,
  ) {}

  async execute(req: CreateAreaRequestDto): Promise<CreateAreaResponseDto> {
    const area = Area.create(req.name, req.entityId);

    const createdArea = await this.areaRepository.createArea(area);

    return {
      id: createdArea.id,
      name: createdArea.name,
      entityId: createdArea.name,
    };
  }

  async update(dto: UpdateAreaRequestDto) {
    const area = await this.areaRepository.findById(dto.id);
    if (!area) throw new NotFoundException('Área no encontrada');

    return this.areaRepository.updateArea(dto.id, { name: dto.name });
  }

  async delete(id: string) {
    const area = await this.areaRepository.findById(id);
    if (!area) throw new NotFoundException('Área no encontrada');
    await this.areaRepository.deleteArea(id);
    return { message: 'Área eliminada correctamente' };
  }
}
