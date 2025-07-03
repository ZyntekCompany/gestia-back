import { UserRole } from '@prisma/client';

export class RefreshToken {
  constructor(
    public readonly id: string,
    public readonly token: string,
    public readonly userId: string,
    public readonly role: UserRole,
    public readonly expiresAt: Date,
    public readonly entityId?: string,
    public readonly isRevoked: boolean = false,
    public readonly createdAt: Date = new Date(),
  ) {}

  static create(
    userId: string,
    token: string,
    role: UserRole,
    expiresAt: Date,
    entityId?: string,
  ): RefreshToken {
    return new RefreshToken(
      crypto.randomUUID(),
      token,
      userId,
      role,
      expiresAt,
      entityId,
    );
  }

  revoke(): RefreshToken {
    return new RefreshToken(
      this.id,
      this.token,
      this.userId,
      this.role,
      this.expiresAt,
      this.entityId,
      true,
      this.createdAt,
    );
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isValid(): boolean {
    return !this.isRevoked && !this.isExpired();
  }
}
