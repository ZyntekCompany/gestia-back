import { Module } from '@nestjs/common';
import { ProcedureController } from 'src/interfaces/controllers/procedure.controller';
import { CreateProcedureUseCase } from 'src/application/use-cases/procedure/create-procedure.use-case';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { PrismaProcedureRepository } from 'src/infrastructure/repositories/prisma-procedure.repository';
import { UpdateProcedureUseCase } from 'src/application/use-cases/procedure/update-procedure.use-case';
import { DeleteProcedureUseCase } from 'src/application/use-cases/procedure/delete-procedure.use-case';
import { NestJsJwtService } from 'src/infrastructure/services/nest-jwt.service';
import { JwtAuthGuard } from 'src/infrastructure/guards/jwt.auth.guard';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';

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
  controllers: [ProcedureController],
  providers: [
    CreateProcedureUseCase,
    UpdateProcedureUseCase,
    DeleteProcedureUseCase,
    PrismaService,
    {
      provide: 'ProcedureRepository',
      useClass: PrismaProcedureRepository,
    },

    JwtAuthGuard,
    NestJsJwtService,
  ],
  exports: [NestJsJwtService, JwtAuthGuard],
})
export class ProcedureModule {}
