import { Inject, Injectable } from '@nestjs/common';
import { PasswordReset } from 'src/domain/entities/password-reset.entity';
import { PasswordResetRepository } from 'src/domain/repositories/password-reset.repository';
import { UserRepository } from 'src/domain/repositories/user.repository';
import { EmailService } from 'src/infrastructure/services/email.service';
import { PasswordService } from 'src/infrastructure/services/password.service';
import {
  ForgotPasswordRequestDto,
  ForgotPasswordResponseDto,
} from 'src/interfaces/dtos/user.dto';

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    @Inject('UserRepository') private readonly userRepository: UserRepository,
    @Inject('PasswordResetRepository')
    private readonly passwordResetRepository: PasswordResetRepository,
    @Inject('PasswordService')
    private readonly passwordService: PasswordService,
    @Inject('EmailService') private readonly emailService: EmailService,
  ) {}

  async execute(
    request: ForgotPasswordRequestDto,
  ): Promise<ForgotPasswordResponseDto> {
    const user = await this.userRepository.findByEmail(request.email);
    if (!user) {
      return {
        message:
          'Si el email existe, se ha enviado un enlace para restablecer la contraseña.',
      };
    }

    const token = this.passwordService.generateResetToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hora

    const existing = await this.passwordResetRepository.findByEmail(
      request.email,
    );
    const latest = existing[0]; // Asumimos 1 solo por usuario (mejor usar `findFirst`)

    if (latest) {
      // ✅ Actualiza el registro existente
      await this.passwordResetRepository.updateTokenById(
        latest.id,
        token,
        expiresAt,
      );
    } else {
      // ✅ Crea solo si no existe uno
      const newReset = PasswordReset.create(request.email, token);
      await this.passwordResetRepository.save(newReset);
    }

    try {
      await this.emailService.sendResetPassword(request.email, token);
    } catch (error) {
      console.error('Error enviando email:', error);
    }

    return {
      message:
        'Si el email existe, se ha enviado un enlace para restablecer la contraseña.',
    };
  }
}
