// src/application/use-cases/entity/list-entity.use-case.ts
import { Inject, Injectable } from '@nestjs/common';
import { PrismaEntityRepository } from 'src/infrastructure/repositories/prisma-entity.repository';
import { TypeEntity } from '@prisma/client';

@Injectable()
export class ListEntityUseCase {
  constructor(
    @Inject('EntityRepository')
    private readonly entityRepository: PrismaEntityRepository,
  ) {}

  async execute(params: {
    type: TypeEntity;
    name?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const [entities, total] = await Promise.all([
      this.entityRepository.findManyFiltered({
        type: params.type,
        name: params.name,
        skip,
        take: limit,
      }),
      this.entityRepository.countFiltered({
        type: params.type,
        name: params.name,
      }),
    ]);
    return {
      entities,
      total,
      page,
      pageCount: Math.ceil(total / limit),
    };
  }
}
