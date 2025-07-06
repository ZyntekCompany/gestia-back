// src/infrastructure/modules/user.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ListUsersByEntityUseCase } from 'src/application/use-cases/auth/list-users-by-entity.use-case';
import { JwtAuthGuard } from 'src/infrastructure/guards/jwt.auth.guard';
import { PrismaUserRepository } from 'src/infrastructure/repositories/auth/prisma-user.repository';
import { NestJsJwtService } from 'src/infrastructure/services/nest-jwt.service';
import { S3Module } from 'src/infrastructure/services/s3/s3.module';
import { UserController } from 'src/interfaces/controllers/user.controller';

@Module({
  imports: [
    S3Module,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
      }),
    }),
  ],
  controllers: [UserController],
  providers: [
    JwtAuthGuard,
    NestJsJwtService,
    ListUsersByEntityUseCase,
    { provide: 'UserRepository', useClass: PrismaUserRepository },
  ],
  exports: [
    ListUsersByEntityUseCase,
    { provide: 'UserRepository', useClass: PrismaUserRepository },
  ],
})
export class UserModule {}
