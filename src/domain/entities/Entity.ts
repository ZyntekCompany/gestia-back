import { Area } from '@prisma/client';
import { TypeEntity as PrismaTypeEntity } from '@prisma/client';

export const TypeEntity = PrismaTypeEntity;
export type TypeEntity = PrismaTypeEntity;

export class Entity {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly type: TypeEntity,
    public readonly imgUrl: string,
    public readonly active: boolean = true,
    public readonly description?: string,
    public readonly phone?: string,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
    public readonly Area?: Area[],
    public areas?: {
      id: string;
      name: string;
      entityId: string;
      lastAssignedIndex: number;
    }[], // ← Agrega esto
  ) {}

  static create(
    name: string,
    type: TypeEntity,
    imgUrl: string,
    active: boolean = true,
    description?: string,
    phone?: string,
  ): Entity {
    const id = crypto.randomUUID();

    return new Entity(id, name, type, imgUrl, active, description, phone);
  }
}
