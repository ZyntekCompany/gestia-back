import { Area, Entity, UserRole } from '@prisma/client';

export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly password: string,
    public readonly fullName: string,
    public readonly role: UserRole,
    public readonly isEmailVerified: boolean = false,
    public readonly active: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
    public readonly entity?: Entity,
    public readonly area?: Area,
  ) {}

  static create(
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
  ): User {
    const id = crypto.randomUUID();
    // Ojo al orden y defaults
    return new User(
      id,
      email,
      password,
      fullName,
      role,
      false, // isEmailVerified
      true, // active
      new Date(),
      new Date(),
    );
  }

  updatePassword(newPassword: string): User {
    return new User(
      this.id,
      this.email,
      newPassword,
      this.fullName,
      this.role,
      this.active,
      this.isEmailVerified,
      this.createdAt,
      new Date(),
    );
  }

  verifyEmail(): User {
    return new User(
      this.id,
      this.email,
      this.password,
      this.fullName,
      this.role,
      true, // <-- Aquí forzamos a true
      this.active,
      this.createdAt,
      new Date(),
      this.entity,
      this.area,
    );
  }
}
