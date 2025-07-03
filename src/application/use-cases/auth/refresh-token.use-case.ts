import { Inject, Injectable } from '@nestjs/common';
import { RefreshToken } from 'src/domain/entities/refresh-token.entity';

import { RefreshTokenRepository } from 'src/domain/repositories/refresh-token.repository';
import { UserRepository } from 'src/domain/repositories/user.repository';
import { NestJsJwtService } from 'src/infrastructure/services/nest-jwt.service';

import {
  RefreshTokenRequestDto,
  RefreshTokenResponseDto,
} from 'src/interfaces/dtos/user.dto';
import { JwtPayload } from 'src/types/express';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject('RefreshTokenRepository')
    private readonly refreshTokenRepository: RefreshTokenRepository,
    @Inject('UserRepository') private readonly userRepository: UserRepository,
    private readonly jwtService: NestJsJwtService,
  ) {}

  async execute(
    request: RefreshTokenRequestDto,
  ): Promise<RefreshTokenResponseDto> {
    // Verify refresh token
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verifyRefreshToken(request.refreshToken);
    } catch {
      throw new Error('Invalid refresh token');
    }

    // Find refresh token in database
    const refreshToken = await this.refreshTokenRepository.findByToken(
      request.refreshToken,
    );
    if (!refreshToken || !refreshToken.isValid()) {
      throw new Error('Invalid or expired refresh token');
    }

    // Find user
    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw new Error('User not found');
    }

    // Revoke old refresh token
    const revokedToken = refreshToken.revoke();
    await this.refreshTokenRepository.update(revokedToken);

    // Generate new tokens
    const newPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      entityId: user.entity?.id,
    };
    const accessToken = this.jwtService.generateAccessToken(newPayload);
    const newRefreshTokenValue =
      this.jwtService.generateRefreshToken(newPayload);

    // Save new refresh tokenF
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const newRefreshToken = RefreshToken.create(
      user.id,
      newRefreshTokenValue,
      user.role,
      expiresAt,
      user.entity?.id,
    );
    await this.refreshTokenRepository.save(newRefreshToken);

    return {
      accessToken,
      refreshToken: newRefreshTokenValue,
    };
  }
}
