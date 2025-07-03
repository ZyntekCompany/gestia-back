import { Entity } from '@prisma/client';

export class Area {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly entityId: string,
    public readonly lastAssignedIndex: number = 0,
    public readonly entity?: Entity,
  ) {}

  static create(name: string, entityId: string): Area {
    const id = crypto.randomUUID();
    return new Area(id, name, entityId);
  }
}
