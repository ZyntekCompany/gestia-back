// src/infrastructure/repositories/prisma-entity.repository.ts
import { Injectable } from '@nestjs/common';
import { EntityRepository } from 'src/domain/repositories/entity.repository';
import { PrismaService } from '../prisma/prisma.service';
import { Entity } from 'src/domain/entities/Entity';
import { TypeEntity } from '@prisma/client';

@Injectable()
export class PrismaEntityRepository implements EntityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(entity: Entity): Promise<Entity> {
    const createdEntity = await this.prisma.entity.create({
      data: {
        name: entity.name,
        description: entity.description,
        phone: entity.phone,
        imgUrl: entity.imgUrl ?? '',
        type: entity.type,
      },
    });

    return {
      ...createdEntity,
      description: createdEntity.description ?? undefined,
      phone: createdEntity.phone ?? undefined,
    };
  }

  async findById(id: string): Promise<Entity> {
    const entity = await this.prisma.entity.findUnique({
      where: { id },
      include: {
        Area: true,
      },
    });
    if (!entity) {
      throw new Error('Entidad no encontrada');
    }
    const entityArea = new Entity(
      entity.id,
      entity.name,
      entity.type,
      entity.imgUrl,
      Boolean(entity.active),
      entity.description!,
      entity.phone!,
      entity.createdAt,
      entity.updatedAt,
    );
    if (entity.Area && entity.Area.length > 0) {
      entityArea.areas = entity.Area.map((area) => ({
        id: area.id,
        name: area.name,
        entityId: area.entityId,
        lastAssignedIndex: area.lastAssignedIndex,
      }));
    }

    return entityArea;
  }
  async updateEntity(entity: Entity): Promise<Entity> {
    const updatedEntity = await this.prisma.entity.update({
      where: { id: entity.id },
      data: {
        name: entity.name,
        description: entity.description,
        phone: entity.phone,
        imgUrl: entity.imgUrl,
        updatedAt: new Date(),
      },
    });
    return new Entity(
      updatedEntity.id,
      updatedEntity.name,
      updatedEntity.type,
      updatedEntity.imgUrl ?? undefined,
      Boolean(updatedEntity.active),
      updatedEntity.description ?? undefined,
      updatedEntity.phone ?? undefined,
      updatedEntity.createdAt,
      updatedEntity.updatedAt,
    );
  }

  async findManyFiltered({
    type,
    name,
    skip = 0,
    take = 10,
  }: {
    type: TypeEntity;
    name?: string;
    skip?: number;
    take?: number;
  }): Promise<Entity[]> {
    const entities = await this.prisma.entity.findMany({
      where: {
        type,
        ...(name && { name: { contains: name, mode: 'insensitive' } }),
        active: true,
      },
      skip,
      take,
      orderBy: { name: 'asc' },
      include: { Area: true },
    });

    return entities.map(
      (e) =>
        new Entity(
          e.id,
          e.name,
          e.type,
          e.imgUrl ?? undefined,
          Boolean(e.active),
          e.description ?? undefined,
          e.phone ?? undefined,
          e.createdAt,
          e.updatedAt,
          e.Area,
          e.Area?.map((area) => ({
            id: area.id,
            name: area.name,
            entityId: area.entityId,
            lastAssignedIndex: area.lastAssignedIndex,
          })),
        ),
    );
  }

  async countFiltered({
    type,
    name,
  }: {
    type: TypeEntity;
    name?: string;
  }): Promise<number> {
    return this.prisma.entity.count({
      where: {
        type,
        ...(name && { name: { contains: name, mode: 'insensitive' } }),
        active: true, // Solo entidades activas, opcional
      },
    });
  }
}
