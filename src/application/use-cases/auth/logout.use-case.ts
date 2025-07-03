import { Inject, Injectable } from '@nestjs/common';
import { RefreshTokenRepository } from 'src/domain/repositories/refresh-token.repository';
import {
  LogoutRequestDto,
  LogoutResponseDto,
} from 'src/interfaces/dtos/user.dto';

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject('RefreshTokenRepository')
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async execute(request: LogoutRequestDto): Promise<LogoutResponseDto> {
    // Find and revoke refresh token
    const refreshToken = await this.refreshTokenRepository.findByToken(
      request.refreshToken,
    );
    if (refreshToken && refreshToken.isValid()) {
      const revokedToken = refreshToken.revoke();
      await this.refreshTokenRepository.update(revokedToken);
    }

    return {
      message: 'Logged out successfully',
    };
  }
}
