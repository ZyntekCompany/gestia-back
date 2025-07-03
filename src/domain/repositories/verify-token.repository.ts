import { Emailverify } from '../entities/valid-email.entity';

export interface VerifyTokenRepository {
  findByToken(token: string): Promise<Emailverify | null>;
  findByUserId(userId: string): Promise<Emailverify[]>;
  save(emailverify: Emailverify): Promise<Emailverify>;
  update(emailverify: Emailverify): Promise<Emailverify>;
  delete(id: string): Promise<void>;
  revokeAllByUserId(userId: string): Promise<void>;
}
