import { PasswordReset } from '../entities/password-reset.entity';

export interface PasswordResetRepository {
  findByToken(token: string): Promise<PasswordReset | null>;
  findByEmail(email: string): Promise<PasswordReset[]>;
  save(passwordReset: PasswordReset): Promise<PasswordReset>;
  update(passwordReset: PasswordReset): Promise<PasswordReset>;
  delete(id: string): Promise<void>;
  updateTokenById(
    id: string,
    newToken: string,
    newExpiresAt: Date,
  ): Promise<void>;
}
