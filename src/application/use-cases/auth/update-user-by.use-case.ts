import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { UserRepository } from 'src/domain/repositories/user.repository';
import { UpdateUserByAdminDto } from 'src/interfaces/dtos/user.dto';
import { JwtPayload } from 'src/types/express';

@Injectable()
export class UpdateUserByAdminUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    requester: JwtPayload,
    targetUserId: string,
    dto: UpdateUserByAdminDto,
  ) {
    const userId = requester.sub;

    if (!userId) {
      throw new Error('User not found');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 1. Cargar el usuario objetivo
    const targetUser = await this.userRepository.findById(targetUserId);
    if (!targetUser)
      throw new BadRequestException('Usuario a editar no existe');

    // 3. (Opcional) Si tienes entidadId: admin solo puede editar usuarios de su propia entidad
    if (user.role === 'ADMIN' && targetUser.entity?.id !== user.entity?.id)
      throw new ForbiddenException('No puedes editar usuarios de otra entidad');

    // 4. Filtra campos permitidos
    const allowedFields = ['email', 'fullName', 'areaId', 'role'];
    Object.keys(dto).forEach((key) => {
      if (!allowedFields.includes(key)) {
        throw new BadRequestException(`No puedes cambiar el campo: ${key}`);
      }
    });

    // 6. Actualiza
    return await this.userRepository.updateUserByAdmin(targetUserId, dto);
  }
}
