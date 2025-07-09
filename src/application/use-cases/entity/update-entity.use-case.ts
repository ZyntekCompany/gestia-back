import { Inject, UnauthorizedException } from '@nestjs/common';
import { TypeEntity } from '@prisma/client';
import { Entity } from 'src/domain/entities/Entity';
import { EntityRepository } from 'src/domain/repositories/entity.repository';
import { UserRepository } from 'src/domain/repositories/user.repository';
import { S3Service } from 'src/infrastructure/services/s3/s3.service';
import {
  CreateEntityResponseDto,
  UpdateEntityRequestDto,
} from 'src/interfaces/dtos/entity.dto';

export class UpdateEntityUseCase {
  constructor(
    @Inject('UserRepository') private readonly userRepository: UserRepository,
    @Inject('EntityRepository') private readonly repo: EntityRepository,
    private readonly s3Service: S3Service,
  ) {}

  async Update(
    id: string,
    req: UpdateEntityRequestDto,
    file?: Express.Multer.File,
  ): Promise<CreateEntityResponseDto> {
    const userId = req.user.sub;

    if (!userId) {
      throw new Error('User not found');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    if (user.role !== 'SUPER' && user.role !== 'ADMIN') {
      throw new UnauthorizedException(
        'No tienes permiso para actualizar un colegio',
      );
    }

    const currentEntity = await this.repo.findById(id);
    if (!currentEntity) {
      throw new UnauthorizedException('Entidad no encontrada');
    }
    let newImgUrl = currentEntity.imgUrl;

    if (file) {
      // 🔒 Guardamos antes de subir
      const previousImgUrl = currentEntity.imgUrl;

      // Subimos nueva imagen
      newImgUrl = await this.s3Service.uploadFile(file);

      // Borramos imagen anterior
      if (previousImgUrl) {
        console.log('Deleting previous image:', previousImgUrl);
        await this.s3Service.deleteFile(previousImgUrl);
      }
    }

    const activeValue =
      typeof req.active === 'string'
        ? req.active === 'true'
        : Boolean(req.active);

    const entity = new Entity(
      currentEntity.id,
      req.name!,
      TypeEntity[req.type as keyof typeof TypeEntity],
      newImgUrl,
      activeValue,
      req.description,
      req.phone,
    );

    const savedEntity = await this.repo.updateEntity(entity);

    return {
      id: savedEntity.id,
      name: savedEntity.name,
      type: savedEntity.type,
      active: savedEntity.active,
      imgUrl: savedEntity.imgUrl ?? undefined,
      description: savedEntity.description ?? '',
      phone: savedEntity.phone!,
      createdAt: savedEntity.createdAt,
      updatedAt: savedEntity.updatedAt,
    };
  }
}
