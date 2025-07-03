import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PasswordResetRepository } from 'src/domain/repositories/password-reset.repository';
import { PasswordReset } from 'src/domain/entities/password-reset.entity';

@Injectable()
export class PrismaPasswordResetRepository implements PasswordResetRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByToken(token: string): Promise<PasswordReset | null> {
    const passwordReset = await this.prisma.passwordReset.findUnique({
      where: { token },
    });

    if (!passwordReset) return null;

    return new PasswordReset(
      passwordReset.id,
      passwordReset.email,
      passwordReset.token,
      passwordReset.expiresAt,
      passwordReset.isUsed,
      passwordReset.createdAt,
    );
  }

  async findByEmail(email: string): Promise<PasswordReset[]> {
    const passwordResets = await this.prisma.passwordReset.findMany({
      where: { email },
    });

    return passwordResets.map(
      (reset) =>
        new PasswordReset(
          reset.id,
          reset.email,
          reset.token,
          reset.expiresAt,
          reset.isUsed,
          reset.createdAt,
        ),
    );
  }

  async save(passwordReset: PasswordReset): Promise<PasswordReset> {
    const savedReset = await this.prisma.passwordReset.create({
      data: {
        id: passwordReset.id,
        email: passwordReset.email,
        token: passwordReset.token,
        expiresAt: passwordReset.expiresAt,
        isUsed: passwordReset.isUsed,
        createdAt: passwordReset.createdAt,
      },
    });

    return new PasswordReset(
      savedReset.id,
      savedReset.email,
      savedReset.token,
      savedReset.expiresAt,
      savedReset.isUsed,
      savedReset.createdAt,
    );
  }

  async update(passwordReset: PasswordReset): Promise<PasswordReset> {
    const updatedReset = await this.prisma.passwordReset.update({
      where: { id: passwordReset.id },
      data: {
        isUsed: passwordReset.isUsed,
      },
    });

    await this.prisma.user.update({
      where: { email: passwordReset.email },
      data: {
        isEmailVerified: true,
      },
    });

    return new PasswordReset(
      updatedReset.id,
      updatedReset.email,
      updatedReset.token,
      updatedReset.expiresAt,
      updatedReset.isUsed,
      updatedReset.createdAt,
    );
  }

  async delete(id: string): Promise<void> {
    await this.prisma.passwordReset.delete({
      where: { id },
    });
  }
  async updateTokenById(
    id: string,
    newToken: string,
    newExpiresAt: Date,
  ): Promise<void> {
    await this.prisma.passwordReset.update({
      where: { id },
      data: {
        token: newToken,
        expiresAt: newExpiresAt,
        isUsed: false,
        createdAt: new Date(),
      },
    });
  }
}
