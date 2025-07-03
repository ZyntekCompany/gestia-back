import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { CreateEntityUseCase } from 'src/application/use-cases/entity/create-entity.use-case';
import { UpdateEntityUseCase } from 'src/application/use-cases/entity/update-entity.use-case';
import { JwtAuthGuard } from 'src/infrastructure/guards/jwt.auth.guard';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { PrismaUserRepository } from 'src/infrastructure/repositories/auth/prisma-user.repository';
import { PrismaEntityRepository } from 'src/infrastructure/repositories/prisma-entity.repository';
import { NestJsJwtService } from 'src/infrastructure/services/nest-jwt.service';
import { S3Module } from 'src/infrastructure/services/s3/s3.module';
import { Entityontroller } from 'src/interfaces/controllers/entity.controller';
import { ListEntityUseCase } from 'src/application/use-cases/entity/list-entity.use-case';

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
  controllers: [Entityontroller],
  providers: [
    ConfigService,
    CreateEntityUseCase,
    ListEntityUseCase,
    UpdateEntityUseCase,

    {
      provide: 'JwtService',
      useClass: NestJsJwtService,
    },
    {
      provide: 'EntityRepository',
      useClass: PrismaEntityRepository,
    },
    {
      provide: 'UserRepository',
      useClass: PrismaUserRepository,
    },

    JwtAuthGuard,
    NestJsJwtService,
  ],
  exports: [
    'JwtService',
    JwtAuthGuard,
    {
      provide: 'EntityRepository',
      useClass: PrismaEntityRepository,
    },
    CreateEntityUseCase,
    ListEntityUseCase,
    UpdateEntityUseCase,
  ],
})
export class EntityModule {}
