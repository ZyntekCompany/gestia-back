import { Inject, Injectable } from '@nestjs/common';
import { PasswordResetRepository } from 'src/domain/repositories/password-reset.repository';
import { RefreshTokenRepository } from 'src/domain/repositories/refresh-token.repository';
import { UserRepository } from 'src/domain/repositories/user.repository';
import { PasswordService } from 'src/infrastructure/services/password.service';
import {
  ResetPasswordRequestDto,
  ResetPasswordResponseDto,
} from 'src/interfaces/dtos/user.dto';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject('UserRepository') private readonly userRepository: UserRepository,
    @Inject('PasswordResetRepository')
    private readonly passwordResetRepository: PasswordResetRepository,
    @Inject('RefreshTokenRepository')
    private readonly refreshTokenRepository: RefreshTokenRepository,
    @Inject('PasswordService')
    private readonly passwordService: PasswordService,
  ) {}

  async execute(
    request: ResetPasswordRequestDto,
  ): Promise<ResetPasswordResponseDto> {
    // Find password reset by token
    const passwordReset = await this.passwordResetRepository.findByToken(
      request.token,
    );
    if (!passwordReset || !passwordReset.isValid()) {
      throw new Error('Invalid or expired reset token');
    }

    // Find user
    const user = await this.userRepository.findByEmail(passwordReset.email);
    if (!user) {
      throw new Error('User not found');
    }

    // Hash new password
    const hashedPassword = await this.passwordService.hash(request.newPassword);

    // Update user password
    const updatedUser = user.updatePassword(hashedPassword);
    await this.userRepository.updateUser(user.id, updatedUser);

    // Mark password reset as used
    const usedPasswordReset = passwordReset.use();
    await this.passwordResetRepository.update(usedPasswordReset);

    // Revoke all refresh tokens for security
    await this.refreshTokenRepository.revokeAllByUserId(user.id);

    return {
      message:
        'La contraseña ha sido restablecida exitosamente. Por favor inicia sesión con tu nueva contraseña.',
    };
  }
}
