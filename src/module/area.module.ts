import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { CreateAreaUseCase } from 'src/application/use-cases/area/area.use-case';
import { JwtAuthGuard } from 'src/infrastructure/guards/jwt.auth.guard';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { PrismaAreaRepository } from 'src/infrastructure/repositories/prisma-area.repositorio';
import { NestJsJwtService } from 'src/infrastructure/services/nest-jwt.service';
import { AreaController } from 'src/interfaces/controllers/area.controller';

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
  ],
  controllers: [AreaController],
  providers: [
    CreateAreaUseCase,
    {
      provide: 'AreaRepository',
      useClass: PrismaAreaRepository,
    },

    JwtAuthGuard,
    NestJsJwtService,
  ],
  exports: [
    NestJsJwtService,
    JwtAuthGuard,
    {
      provide: 'AreaRepository',
      useClass: PrismaAreaRepository,
    },
  ],
})
export class AreaModule {}
