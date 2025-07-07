// src/infrastructure/modules/entity.module.ts
import { Module } from '@nestjs/common';
import { CreateEntityUseCase } from 'src/application/use-cases/entity/create-entity.use-case';
import { UpdateEntityUseCase } from 'src/application/use-cases/entity/update-entity.use-case';
import { ListEntityUseCase } from 'src/application/use-cases/entity/list-entity.use-case';
import { PrismaEntityRepository } from 'src/infrastructure/repositories/prisma-entity.repository';
import { PrismaUserRepository } from 'src/infrastructure/repositories/auth/prisma-user.repository';
import { Entityontroller } from 'src/interfaces/controllers/entity.controller';

@Module({
  controllers: [Entityontroller],
  providers: [
    CreateEntityUseCase,
    ListEntityUseCase,
    UpdateEntityUseCase,
    { provide: 'EntityRepository', useClass: PrismaEntityRepository },
    { provide: 'UserRepository', useClass: PrismaUserRepository },
  ],
  exports: [
    { provide: 'EntityRepository', useClass: PrismaEntityRepository },
    CreateEntityUseCase,
    ListEntityUseCase,
    UpdateEntityUseCase,
  ],
})
export class EntityModule {}
