import { Injectable } from '@nestjs/common';
import { RefreshToken } from 'src/domain/entities/refresh-token.entity';
import { RefreshTokenRepository } from 'src/domain/repositories/refresh-token.repository';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByToken(token: string): Promise<RefreshToken | null> {
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!refreshToken) return null;

    return new RefreshToken(
      refreshToken.id,
      refreshToken.token,
      refreshToken.userId,
      refreshToken.role ?? UserRole.CITIZEN,
      refreshToken.expiresAt,
      refreshToken.entityId ?? undefined,
      refreshToken.isRevoked,
      refreshToken.createdAt,
    );
  }

  async findByUserId(userId: string): Promise<RefreshToken[]> {
    const refreshTokens = await this.prisma.refreshToken.findMany({
      where: { userId },
    });

    return refreshTokens.map(
      (token) =>
        new RefreshToken(
          token.id,
          token.token,
          token.userId,
          token.role ?? UserRole.CITIZEN,
          token.expiresAt,
          token.entityId ?? undefined,
          token.isRevoked,
          token.createdAt,
        ),
    );
  }

  async save(refreshToken: RefreshToken): Promise<RefreshToken> {
    // Eliminar todos los refresh tokens anteriores del usuario
    await this.prisma.refreshToken.deleteMany({
      where: { userId: refreshToken.userId },
    });

    const userExists = await this.prisma.user.findUnique({
      where: { id: refreshToken.userId },
    });

    if (!userExists) {
      throw new Error(
        `User con id ${refreshToken.userId} no existe (¡en save de RefreshToken!)`,
      );
    }

    const savedToken = await this.prisma.refreshToken.create({
      data: {
        id: refreshToken.id,
        token: refreshToken.token,
        userId: refreshToken.userId,
        role: refreshToken.role ?? UserRole.CITIZEN,
        entityId: refreshToken.entityId ?? undefined,
        expiresAt: refreshToken.expiresAt,
        isRevoked: refreshToken.isRevoked,
        createdAt: refreshToken.createdAt,
      },
    });

    return new RefreshToken(
      savedToken.id,
      savedToken.token,
      savedToken.userId,
      savedToken.role ?? UserRole.CITIZEN,
      savedToken.expiresAt,
      savedToken.entityId ?? undefined,
      savedToken.isRevoked,
      savedToken.createdAt,
    );
  }

  async update(refreshToken: RefreshToken): Promise<RefreshToken> {
    const updatedToken = await this.prisma.refreshToken.update({
      where: { id: refreshToken.id },
      data: {
        isRevoked: refreshToken.isRevoked,
      },
    });

    return new RefreshToken(
      updatedToken.id,
      updatedToken.token,
      updatedToken.userId,
      updatedToken.role ?? UserRole.CITIZEN,
      updatedToken.expiresAt,
      updatedToken.entityId ?? undefined,
      updatedToken.isRevoked,
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
