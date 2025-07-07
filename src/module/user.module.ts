// src/infrastructure/modules/user.module.ts
import { Module } from '@nestjs/common';
import { ListUsersByEntityUseCase } from 'src/application/use-cases/auth/list-users-by-entity.use-case';
import { PrismaUserRepository } from 'src/infrastructure/repositories/auth/prisma-user.repository';
import { UserController } from 'src/interfaces/controllers/user.controller';

@Module({
  controllers: [UserController],
  providers: [
    ListUsersByEntityUseCase,
    { provide: 'UserRepository', useClass: PrismaUserRepository },
  ],
  exports: [
    ListUsersByEntityUseCase,
    { provide: 'UserRepository', useClass: PrismaUserRepository },
  ],
})
export class UserModule {}
