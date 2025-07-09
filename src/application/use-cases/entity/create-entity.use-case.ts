// src/application/use-cases/create-entity.use-case.ts
import { Inject, UnauthorizedException } from '@nestjs/common';
import { Entity, TypeEntity } from 'src/domain/entities/Entity';
import { EntityRepository } from 'src/domain/repositories/entity.repository';
import { UserRepository } from 'src/domain/repositories/user.repository';
import { S3Service } from 'src/infrastructure/services/s3/s3.service';
import {
  CreateEntityRequestDto,
  CreateEntityResponseDto,
} from 'src/interfaces/dtos/entity.dto';

export class CreateEntityUseCase {
  constructor(
    @Inject('UserRepository') private readonly userRepository: UserRepository,
    @Inject('EntityRepository') private readonly repo: EntityRepository,
    private readonly s3Service: S3Service,
  ) {}

  async execute(
    req: CreateEntityRequestDto,
    file: Express.Multer.File,
  ): Promise<CreateEntityResponseDto> {
    const userId = req.user.sub;

    if (!userId) {
      throw new Error('User not found');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (user.role !== 'SUPER') {
      throw new UnauthorizedException(
        'No tienes permiso para crear una entidad.',
      );
    }

    if (!file) {
      throw new Error('No se ha subido una imagen');
    }

    const imgUrl = await this.s3Service.uploadFile(file);

    const activeValue =
      typeof req.active === 'string'
        ? req.active === 'true'
        : Boolean(req.active);

    const entity = Entity.create(
      req.name,
      TypeEntity[req.type as keyof typeof TypeEntity],
      imgUrl,
      activeValue,
      req.description,
      req.phone,
    );

    const createdEntity = await this.repo.create(entity);

    return {
      id: createdEntity.id,
      name: createdEntity.name,
      type: createdEntity.type,
      active: createdEntity.active,
      description: createdEntity.description ?? '',
      phone: createdEntity.phone ?? '',
      imgUrl: createdEntity.imgUrl,
      createdAt: createdEntity.createdAt,
      updatedAt: createdEntity.updatedAt,
    };
  }
}
