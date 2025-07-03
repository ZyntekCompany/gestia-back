import { RefreshToken } from '../entities/refresh-token.entity';

export interface RefreshTokenRepository {
  findByToken(token: string): Promise<RefreshToken | null>;
  findByUserId(userId: string): Promise<RefreshToken[]>;
  save(refreshToken: RefreshToken): Promise<RefreshToken>;
  update(refreshToken: RefreshToken): Promise<RefreshToken>;
  delete(id: string): Promise<void>;
  revokeAllByUserId(userId: string): Promise<void>;
}
