import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { UserRepository } from 'src/domain/repositories/user.repository';
import { VerifyTokenRepository } from 'src/domain/repositories/verify-token.repository';
import { EmailService } from 'src/infrastructure/services/email.service';
import { Emailverify } from 'src/domain/entities/valid-email.entity';
import { UpdateCitizenDto } from 'src/interfaces/dtos/user.dto';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject('UserRepository') private readonly userRepository: UserRepository,
    @Inject('VerifyTokenRepository')
    private readonly verifyTokenRepository: VerifyTokenRepository,
    @Inject('EmailService') private readonly emailService: EmailService,
  ) {}

  async execute(userId: string, dto: UpdateCitizenDto) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new BadRequestException('Usuario no existe');

    let needsEmailVerification = false;

    // Si cambia el correo, hay que verificar de nuevo
    if (dto.email && dto.email !== user.email) {
      dto.isEmailVerified = false;
      needsEmailVerification = true;
    }

    // Actualiza usuario
    const updatedUser = await this.userRepository.updateUser(userId, dto);

    // Si cambió el correo, envía verificación
    if (needsEmailVerification) {
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const verifyToken = Emailverify.create(userId, token, expiresAt);
      await this.verifyTokenRepository.save(verifyToken);

      await this.emailService.sendEmailVerification(
        updatedUser.email,
        updatedUser.fullName,
        token,
      );
    }

    return updatedUser;
  }
}
