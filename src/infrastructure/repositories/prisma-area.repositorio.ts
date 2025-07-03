import { Injectable } from '@nestjs/common';
import { AreaRepository } from 'src/domain/repositories/area.repository';
import { PrismaService } from '../prisma/prisma.service';
import { Area } from 'src/domain/entities/area';

@Injectable()
export class PrismaAreaRepository implements AreaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createArea(area: Area): Promise<Area> {
    const created = await this.prisma.area.create({
      data: {
        id: area.id,
        name: area.name,
        entityId: area.entityId,
      },
    });

    return new Area(created.id, created.name, created.entityId);
  }

  async findById(id: string): Promise<Area | null> {
    const found = await this.prisma.area.findUnique({
      where: { id },
      include: { entity: true },
    });
    return found
      ? new Area(
          found.id,
          found.name,
          found.entityId,
          found.lastAssignedIndex,
          found.entity,
        )
      : null;
  }

  async updateArea(id: string, data: Partial<Area>): Promise<Area> {
    const updated = await this.prisma.area.update({
      where: { id },
      data: {
        name: data.name,
        // puedes agregar más campos si agregas a la entidad...
      },
      include: { entity: true },
    });
    return new Area(
      updated.id,
      updated.name,
      updated.entityId,
      updated.lastAssignedIndex,
      updated.entity,
    );
  }

  async deleteArea(id: string): Promise<void> {
    await this.prisma.area.delete({
      where: { id },
    });
  }
}
