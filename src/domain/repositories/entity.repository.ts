import { Entity } from '../entities/Entity';

// src/domain/repositories/entity.repository.ts
export interface EntityRepository {
  create(entity: Entity): Promise<Entity>;
  findById(id: string): Promise<Entity>;
  updateEntity(entity: Entity): Promise<Entity>;
}
