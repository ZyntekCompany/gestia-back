export class Emailverify {
  constructor(
    public readonly id: string,
    public readonly token: string,
    public readonly userId: string,
    public readonly expiresAt: Date,
    public readonly used: boolean = false,
    public readonly createdAt: Date = new Date(),
  ) {}

  static create(userId: string, token: string, expiresAt: Date): Emailverify {
    return new Emailverify(crypto.randomUUID(), token, userId, expiresAt);
  }

  use(): Emailverify {
    return new Emailverify(
      this.id,
      this.token,
      this.userId,
      this.expiresAt,
      true,
      this.createdAt,
    );
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isValid(): boolean {
    return !this.used && !this.isExpired();
  }
}
