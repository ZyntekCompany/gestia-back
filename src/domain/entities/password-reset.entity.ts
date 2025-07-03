export class PasswordReset {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly token: string,
    public readonly expiresAt: Date,
    public readonly isUsed: boolean = false,
    public readonly createdAt: Date = new Date(),
  ) {}

  static create(email: string, token: string): PasswordReset {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiration

    return new PasswordReset(crypto.randomUUID(), email, token, expiresAt);
  }

  use(): PasswordReset {
    return new PasswordReset(
      this.id,
      this.email,
      this.token,
      this.expiresAt,
      true,
      this.createdAt,
    );
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isValid(): boolean {
    return !this.isUsed && !this.isExpired();
  }
}
