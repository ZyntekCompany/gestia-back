// src/domain/entities/procedure.ts

export class Procedure {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly maxResponseDays: number,
    public readonly entityId: string,
    public readonly areaId?: string | null,
  ) {}

  static create(
    name: string,
    description: string | null,
    maxResponseDays: number,
    entityId: string,
    areaId?: string | null,
  ): Procedure {
    const id = crypto.randomUUID();
    return new Procedure(
      id,
      name,
      description,
      maxResponseDays,
      entityId,
      areaId,
    );
  }
}
