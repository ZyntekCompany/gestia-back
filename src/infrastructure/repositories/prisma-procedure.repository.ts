import { Inject, Injectable } from '@nestjs/common';
import { ProcedureRepository } from 'src/domain/repositories/procedure.repository';
import { Procedure } from 'src/domain/entities/procedure';
import { PrismaService } from '../prisma/prisma.service';
import { UserRepository } from 'src/domain/repositories/user.repository';

@Injectable()
export class PrismaProcedureRepository implements ProcedureRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('UserRepository') private readonly userRepository: UserRepository,
  ) {}

  async createProcedure(procedure: Procedure): Promise<Procedure> {
    const created = await this.prisma.procedure.create({
      data: {
        id: procedure.id,
        name: procedure.name,
        description: procedure.description,
        maxResponseDays: procedure.maxResponseDays,
        entityId: procedure.entityId,
        areaId: procedure.areaId ?? undefined,
      },
    });

    return new Procedure(
      created.id,
      created.name,
      created.description,
      created.maxResponseDays,
      created.entityId,
      created.areaId,
    );
  }

  async findById(id: string): Promise<Procedure | null> {
    const found = await this.prisma.procedure.findUnique({ where: { id } });
    return found
      ? new Procedure(
          found.id,
          found.name,
          found.description,
          found.maxResponseDays,
          found.entityId,
          found.areaId,
        )
      : null;
  }

  async updateProcedure(
    id: string,
    data: Partial<Procedure>,
  ): Promise<Procedure> {
    const updated = await this.prisma.procedure.update({
      where: { id },
      data: {
        ...data,
      },
    });
    return new Procedure(
      updated.id,
      updated.name,
      updated.description,
      updated.maxResponseDays,
      updated.entityId,
      updated.areaId,
    );
  }

  async deleteProcedure(id: string): Promise<void> {
    await this.prisma.procedure.delete({
      where: { id },
    });
  }

  async findByAreaId(areaId: string): Promise<Procedure[]> {
    const procedures = await this.prisma.procedure.findMany({
      where: { areaId },
    });
    return procedures.map(
      (p) =>
        new Procedure(
          p.id,
          p.name,
          p.description,
          p.maxResponseDays,
          p.entityId,
          p.areaId,
        ),
    );
  }

  async findByEntityId(entityId: string, userId: string): Promise<Procedure[]> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return [];
    }

    // Si el usuario tiene un área asignada, traer solo procedimientos de esa área
    if (user.area) {
      const procedures = await this.prisma.procedure.findMany({
        where: {
          entityId,
          areaId: user.area.id,
        },
      });
      return procedures.map(
        (p) =>
          new Procedure(
            p.id,
            p.name,
            p.description,
            p.maxResponseDays,
            p.entityId,
            p.areaId,
          ),
      );
    }

    // Si el usuario no tiene área asignada, traer procedimientos de áreas que tienen funcionarios
    const areasWithUsers = await this.prisma.area.findMany({
      where: {
        users: {
          some: {
            active: true,
            role: {
              in: ['OFFICER', 'ADMIN', 'SUPER'],
            },
          },
        },
      },
      select: {
        id: true,
      },
    });

    const areaIdsWithUsers = areasWithUsers.map((area) => area.id);

    const procedures = await this.prisma.procedure.findMany({
      where: {
        entityId,
        areaId: {
          in: areaIdsWithUsers,
        },
      },
    });
    return procedures.map(
      (p) =>
        new Procedure(
          p.id,
          p.name,
          p.description,
          p.maxResponseDays,
          p.entityId,
          p.areaId,
        ),
    );
  }
}
