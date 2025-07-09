import { Inject, Injectable } from '@nestjs/common';
import { AreaRepository } from 'src/domain/repositories/area.repository';
import { AreaDto } from 'src/interfaces/dtos/user.dto';

@Injectable()
export class ListAreasUseCase {
  constructor(
    @Inject('AreaRepository') private readonly areaRepository: AreaRepository,
  ) {}

  async execute(
    entityId: string,
    page = 1,
    limit = 10,
    name?: string,
  ): Promise<{
    data: AreaDto[];
    total: number;
    pageCount: number;
    page: number;
  }> {
    const { data, total } = await this.areaRepository.findAllByEntity(
      entityId,
      page,
      limit,
      name,
    );
    const pageCount = Math.ceil(total / limit);
    return {
      data,
      total,
      page,
      pageCount,
    };
  }
}
