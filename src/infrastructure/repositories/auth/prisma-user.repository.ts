import { Injectable } from '@nestjs/common';
import { User } from 'src/domain/entities/User';
import { UserRepository } from 'src/domain/repositories/user.repository';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import {
  EntityWithUsersDto,
  UserListPaginatedDto,
} from 'src/interfaces/dtos/user.dto';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        entity: true,
        area: true,
      },
    });

    if (!user) return null;

    const userEntity = new User(
      user.id,
      user.email,
      user.password,
      user.fullName,
      user.role,
      user.isEmailVerified,
      Boolean(user.active),
      user.createdAt,
      user.updatedAt,
      user.entity ?? undefined,
      user.area ?? undefined,
    );

    return userEntity;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        entity: true,
        area: true,
      },
    });
    if (!user) return null;

    const userEntity = new User(
      user.id,
      user.email,
      user.password,
      user.fullName,
      user.role,
      user.isEmailVerified,
      Boolean(user.active),
      user.createdAt,
      user.updatedAt,
      user.entity ?? undefined,
      user.area ?? undefined,
    );
    return userEntity;
  }

  async save(user: User, entityId: string, areaId: string): Promise<User> {
    const createdUser = await this.prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        password: user.password,
        fullName: user.fullName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        active: user.active,
        areaId: areaId ?? undefined,
        entityId: entityId ?? undefined,
      },
    });
    const userEntity = new User(
      createdUser.id,
      createdUser.email,
      createdUser.password,
      createdUser.fullName,
      createdUser.role,
      createdUser.isEmailVerified,
      Boolean(createdUser.active),
      createdUser.createdAt,
      createdUser.updatedAt,
    );
    return userEntity;
  }

  async saveCitizen(
    user: User,
    extra: {
      typePerson: string;
      typeIdentification: string;
      numberIdentification: string;
      phone: string;
      gender: string;
      country: string;
      birthDate: Date;
      address: string;
      city: string;
    },
  ): Promise<User> {
    const createdUser = await this.prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        password: user.password,
        fullName: user.fullName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        active: user.active,
        typePerson: extra.typePerson,
        typeIdentification: extra.typeIdentification,
        numberIdentification: extra.numberIdentification,
        phone: extra.phone,
        gender: extra.gender,
        country: extra.country,
        birthDate: extra.birthDate,
        address: extra.address,
        city: extra.city,
        // NO entityId, NO areaId
      },
    });

    return new User(
      createdUser.id,
      createdUser.email,
      createdUser.password,
      createdUser.fullName,
      createdUser.role,
      createdUser.isEmailVerified,
      Boolean(createdUser.active),
      createdUser.createdAt,
      createdUser.updatedAt,
      undefined, // entity
      undefined, // area
    );
  }

  // Reemplaza updateCitizen y update por este método
  async updateUser(userId: string, data: Partial<User>): Promise<User> {
    const user = await this.findById(userId);
    if (!user) throw new Error('Usuario no encontrado');

    const allowedFields = [
      'email',
      'password',
      'fullName',
      'isEmailVerified',
      'active',
      'typePerson',
      'typeIdentification',
      'numberIdentification',
      'phone',
      'gender',
      'country',
      'birthDate',
      'address',
      'city',
      'entityId',
      'areaId',
      // lo que necesites
    ];

    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([key]) => allowedFields.includes(key)),
    );

    filteredData.updatedAt = new Date();

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: filteredData,
      include: { entity: true, area: true },
    });

    return new User(
      updatedUser.id,
      updatedUser.email,
      updatedUser.password,
      updatedUser.fullName,
      updatedUser.role,
      updatedUser.isEmailVerified,
      Boolean(updatedUser.active),
      updatedUser.createdAt,
      updatedUser.updatedAt,
      updatedUser.entity ?? undefined,
      updatedUser.area ?? undefined,
    );
  }

  async delete(id: string): Promise<void> {
    const user = await this.prisma.user.delete({
      where: { id },
    });
    const resetId = await this.prisma.passwordReset.findFirst({
      where: { email: user.email },
      select: { id: true },
    });
    if (resetId) {
      await this.prisma.passwordReset.delete({
        where: { id: resetId.id },
      });
    }
  }

  // src/infrastructure/repositories/auth/prisma-user.repository.ts
  async listUsersPaginated(params: {
    entityId?: string;
    page?: number;
    limit?: number;
    isEmailVerified?: boolean;
    active?: boolean;
    search?: string;
    forAdmin?: boolean;
  }): Promise<UserListPaginatedDto> {
    const {
      entityId,
      page = 1,
      limit = 10,
      isEmailVerified,
      active,
      search,
      forAdmin,
    } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (entityId) where.entityId = entityId;
    if (isEmailVerified !== undefined) where.isEmailVerified = isEmailVerified;
    if (active !== undefined) where.active = active;
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: { entity: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    if (forAdmin) {
      return {
        total,
        page,
        limit,
        entities: [
          {
            id: entityId || '',
            name: users[0]?.entity?.name || '',
            imgUrl: users[0]?.entity?.imgUrl || '',
            users: users.map((user) => ({
              id: user.id,
              email: user.email,
              fullName: user.fullName,
              role: user.role,
              isEmailVerified: user.isEmailVerified,
              active: user.active,
            })),
          },
        ],
      };
    }

    // SUPER: agrupado por entidad
    const entitiesMap: Record<string, EntityWithUsersDto> = {};
    for (const user of users) {
      const eid = user.entity?.id || 'no-entity';
      if (!entitiesMap[eid]) {
        entitiesMap[eid] = {
          id: user.entity?.id || '',
          name: user.entity?.name || '',
          imgUrl: user.entity?.imgUrl || '',
          users: [],
        };
      }
      entitiesMap[eid].users.push({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        active: user.active,
      });
    }

    return {
      total,
      page,
      limit,
      entities: Object.values(entitiesMap),
    };
  }
}
