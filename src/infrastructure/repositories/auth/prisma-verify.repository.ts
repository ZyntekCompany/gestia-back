import { Injectable } from '@nestjs/common';
import { Emailverify } from 'src/domain/entities/valid-email.entity';
import { VerifyTokenRepository } from 'src/domain/repositories/verify-token.repository';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@Injectable()
export class PrismaVerifyTokenRepository implements VerifyTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByToken(token: string): Promise<Emailverify | null> {
    const emailverify = await this.prisma.emailVerification.findUnique({
      where: { token },
    });

    if (!emailverify) return null;

    return new Emailverify(
      emailverify.id,
      emailverify.token,
      emailverify.userId,
      emailverify.expiresAt,
      emailverify.used,
      emailverify.createdAt,
    );
  }

  async findByUserId(userId: string): Promise<Emailverify[]> {
    const emailverifys = await this.prisma.emailVerification.findMany({
      where: { userId },
    });

    return emailverifys.map(
      (token) =>
        new Emailverify(
          token.id,
          token.token,
          token.userId,
          token.expiresAt,
          token.used,
          token.createdAt,
        ),
    );
  }

  async save(emailverify: Emailverify): Promise<Emailverify> {
    // Eliminar todos los refresh tokens anteriores del usuario
    await this.prisma.emailVerification.deleteMany({
      where: { userId: emailverify.userId },
    });

    const savedToken = await this.prisma.emailVerification.create({
      data: {
        id: emailverify.id,
        token: emailverify.token,
        userId: emailverify.userId,
        expiresAt: emailverify.expiresAt,
        used: emailverify.used,
        createdAt: emailverify.createdAt,
      },
    });

    return new Emailverify(
      savedToken.id,
      savedToken.token,
      savedToken.userId,
      savedToken.expiresAt,
      savedToken.used,
      savedToken.createdAt,
    );
  }

  async update(emailverify: Emailverify): Promise<Emailverify> {
    const updatedToken = await this.prisma.emailVerification.update({
      where: { id: emailverify.id },
      data: {
        used: emailverify.used,
      },
    });

    await this.prisma.user.update({
      where: { id: emailverify.userId },
      data: {
        isEmailVerified: true,
      },
    });

    return new Emailverify(
      updatedToken.id,
      updatedToken.token,
      updatedToken.userId,
      updatedToken.expiresAt,
      updatedToken.used,
      updatedToken.createdAt,
    );
  }

  async delete(id: string): Promise<void> {
    await this.prisma.refreshToken.delete({
      where: { id },
    });
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  }
}
