import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { VerifyTokenRepository } from 'src/domain/repositories/verify-token.repository';
import { UserRepository } from 'src/domain/repositories/user.repository';

@Injectable()
export class VerifyEmailUseCase {
  constructor(
    @Inject('VerifyTokenRepository')
    private readonly verifyTokenRepository: VerifyTokenRepository,
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
  ) {}

  async execute(token: string): Promise<{ message: string }> {
    // 1. Buscar el token de verificación
    const emailVerify = await this.verifyTokenRepository.findByToken(token);
    if (!emailVerify) {
      throw new BadRequestException('Token de verificación inválido.');
    }

    // 2. ¿Ya está usado o expirado?
    if (!emailVerify.isValid()) {
      throw new BadRequestException('El token ya fue usado o expiró.');
    }

    // 3. Buscar usuario
    const user = await this.userRepository.findById(emailVerify.userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    // 4. Si ya está verificado, devuelve éxito pero no repite acción
    if (user.isEmailVerified) {
      return { message: 'El correo ya estaba verificado.' };
    }

    // 5. Marcar usuario como verificado
    const verifiedUser = user.verifyEmail();
    await this.userRepository.updateUser(user.id, verifiedUser);

    // 6. Marcar token como usado
    const usedToken = emailVerify.use();
    await this.verifyTokenRepository.update(usedToken);

    return {
      message: 'Correo verificado exitosamente. Ya puedes iniciar sesión.',
    };
  }
}
