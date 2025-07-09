import {
  Inject,
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { RefreshToken } from 'src/domain/entities/refresh-token.entity';
import { RefreshTokenRepository } from 'src/domain/repositories/refresh-token.repository';
import { UserRepository } from 'src/domain/repositories/user.repository';
import { NestJsJwtService } from 'src/infrastructure/services/nest-jwt.service';
import { PasswordService } from 'src/infrastructure/services/password.service';
import {
  LoginRequestDto,
  LoginResponseDto,
} from 'src/interfaces/dtos/user.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject('UserRepository') private readonly userRepository: UserRepository,
    @Inject('RefreshTokenRepository')
    private readonly refreshTokenRepository: RefreshTokenRepository,
    @Inject('PasswordService')
    private readonly passwordService: PasswordService,
    private readonly jwtService: NestJsJwtService,
  ) {}

  async execute(request: LoginRequestDto): Promise<LoginResponseDto> {
    // Find user by email
    const user = await this.userRepository.findByEmail(request.email);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verify password
    const isPasswordValid = await this.passwordService.compare(
      request.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.active) {
      throw new BadRequestException('Tu cuenta no está activa.');
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      throw new BadRequestException(
        'Por favor verifica tu correo antes de iniciar sesión',
      );
    }

    console.log('Login con user id:', user.id, user.email);

    // Generate tokens
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role ?? UserRole.CITIZEN,
      entityId: user.entity?.id,
    };
    const accessToken = this.jwtService.generateAccessToken(payload);
    const refreshTokenValue = this.jwtService.generateRefreshToken(payload);

    // Save refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const refreshToken = RefreshToken.create(
      user.id,
      refreshTokenValue,
      user.role ?? UserRole.CITIZEN,
      expiresAt,
      user.entity?.id ?? undefined,
    );
    await this.refreshTokenRepository.save(refreshToken);

    const response: LoginResponseDto = {
      accessToken,
      refreshToken: refreshTokenValue,
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      activate: user.active,
      isEmailVerified: user.isEmailVerified,
    };

    if (user.area) {
      response.area = { id: user.area.id, name: user.area.name };
    }
    if (user.entity) {
      response.entity = {
        id: user.entity.id,
        name: user.entity.name,
        imgUrl: user.entity.imgUrl,
        description: user.entity.description!,
        phone: user.entity.phone!,
        type: user.entity.type,
        active: user.entity.active,
        createdAt: user.createdAt,
      };
    }

    return response;
  }
}
