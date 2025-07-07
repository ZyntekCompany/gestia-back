// src/infrastructure/modules/auth.module.ts
import { Module } from '@nestjs/common';
import { RegisterUseCase } from 'src/application/use-cases/auth/register-user.use-case';
import { LoginUseCase } from 'src/application/use-cases/auth/login.use-case';
import { UpdateUserUseCase } from 'src/application/use-cases/auth/update.use-case';
import { RefreshTokenUseCase } from 'src/application/use-cases/auth/refresh-token.use-case';
import { ForgotPasswordUseCase } from 'src/application/use-cases/auth/forgot-password.use-case';
import { ResetPasswordUseCase } from 'src/application/use-cases/auth/reset-password.use-case';
import { LogoutUseCase } from 'src/application/use-cases/auth/logout.use-case';
import { VerifyEmailUseCase } from 'src/application/use-cases/auth/verify-email.use-case';
import { UpdateUserByAdminUseCase } from 'src/application/use-cases/auth/update-user-by.use-case';
import { PrismaUserRepository } from 'src/infrastructure/repositories/auth/prisma-user.repository';
import { PrismaRefreshTokenRepository } from 'src/infrastructure/repositories/auth/prisma-refresh-token.repository';
import { PrismaPasswordResetRepository } from 'src/infrastructure/repositories/auth/prisma-password-reset.repository';
import { PrismaAreaRepository } from 'src/infrastructure/repositories/prisma-area.repositorio';
import { PrismaEntityRepository } from 'src/infrastructure/repositories/prisma-entity.repository';
import { PrismaVerifyTokenRepository } from 'src/infrastructure/repositories/auth/prisma-verify.repository';
import { BcryptPasswordService } from 'src/infrastructure/services/bcrypt-password.service';
import { BrevoEmailService } from 'src/infrastructure/services/brevo-email.service';
import { AuthController } from 'src/interfaces/controllers/auth.controller';

@Module({
  controllers: [AuthController],
  providers: [
    // Use Cases
    RegisterUseCase,
    LoginUseCase,
    UpdateUserUseCase,
    RefreshTokenUseCase,
    ForgotPasswordUseCase,
    UpdateUserByAdminUseCase,
    ResetPasswordUseCase,
    LogoutUseCase,
    VerifyEmailUseCase,

    // Repositories & Services
    { provide: 'UserRepository', useClass: PrismaUserRepository },
    {
      provide: 'RefreshTokenRepository',
      useClass: PrismaRefreshTokenRepository,
    },
    {
      provide: 'PasswordResetRepository',
      useClass: PrismaPasswordResetRepository,
    },
    { provide: 'PasswordService', useClass: BcryptPasswordService },
    { provide: 'EmailService', useClass: BrevoEmailService },
    { provide: 'AreaRepository', useClass: PrismaAreaRepository },
    { provide: 'VerifyTokenRepository', useClass: PrismaVerifyTokenRepository },
    { provide: 'EntityRepository', useClass: PrismaEntityRepository },
  ],
  exports: [
    // Exporta lo necesario para otros módulos (casos de uso, repositorios, etc)
  ],
})
export class AuthModule {}
