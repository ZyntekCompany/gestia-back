import { Entity, TypeEntity } from '../entities/Entity';

// src/domain/repositories/entity.repository.ts
export interface EntityRepository {
  create(entity: Entity): Promise<Entity>;
  findById(id: string): Promise<Entity>;
  updateEntity(entity: Entity): Promise<Entity>;
  findManyFiltered(params: {
    type: TypeEntity;
    name?: string;
    skip?: number;
    take?: number;
  }): Promise<Entity[]>;
  countFiltered(params: { type: TypeEntity; name?: string }): Promise<number>;
}
