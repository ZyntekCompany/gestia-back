// src/request/request.module.ts
import { Module } from '@nestjs/common';
import { AssignAreaUseCase } from 'src/application/use-cases/request/assign-area.use-case';
import { CreateRequestUseCase } from 'src/application/use-cases/request/create-request.usecase';
import { FindHistoryUseCase } from 'src/application/use-cases/request/find-history.usecase';
import { RespondRequestUseCase } from 'src/application/use-cases/request/respond-request.usecase';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { PrismaRequestRepository } from 'src/infrastructure/repositories/prisma-request.repository';
import { RequestsGateway } from 'src/infrastructure/services/webSocket-gateway.service';
import { RequestController } from 'src/interfaces/controllers/request.controller';
import { S3Module } from 'src/infrastructure/services/s3/s3.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from 'src/infrastructure/guards/jwt.auth.guard';
import { NestJsJwtService } from 'src/infrastructure/services/nest-jwt.service';

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
  controllers: [RequestController],
  providers: [
    PrismaService,
    CreateRequestUseCase,
    AssignAreaUseCase,
    RespondRequestUseCase,
    FindHistoryUseCase,
    RequestsGateway,

    { provide: 'RequestRepository', useClass: PrismaRequestRepository },
    JwtAuthGuard,
    NestJsJwtService,
  ],
})
export class RequestModule {}
