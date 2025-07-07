// src/infrastructure/modules/global.module.ts
import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from 'src/infrastructure/guards/jwt.auth.guard';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { NestJsJwtService } from 'src/infrastructure/services/nest-jwt.service';
import { S3Module } from 'src/infrastructure/services/s3/s3.module';

@Global()
@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
      }),
    }),
    PrismaModule,
    S3Module,
  ],
  providers: [JwtAuthGuard, NestJsJwtService],
  exports: [JwtModule, PrismaModule, JwtAuthGuard, NestJsJwtService, S3Module],
})
export class GlobalModule {}
