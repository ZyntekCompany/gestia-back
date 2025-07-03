// src/application/use-cases/auth/list-users-by-entity.use-case.ts
import { Inject, Injectable } from '@nestjs/common';
import { UserRepository } from 'src/domain/repositories/user.repository';

@Injectable()
export class ListUsersByEntityUseCase {
  constructor(
    @Inject('UserRepository') private readonly userRepository: UserRepository,
  ) {}

  async execute({
    entityId,
    page = 1,
    limit = 10,
    isEmailVerified,
    active,
    search,
    forAdmin = false,
  }: {
    entityId?: string;
    page?: number;
    limit?: number;
    isEmailVerified?: boolean;
    active?: boolean;
    search?: string;
    forAdmin?: boolean;
  }) {
    return this.userRepository.listUsersPaginated({
      entityId,
      page,
      limit,
      isEmailVerified,
      active,
      search,
      forAdmin,
    });
  }
}
