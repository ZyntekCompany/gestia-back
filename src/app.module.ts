import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './infrastructure/prisma/prisma.service';
import { EntityModule } from './module/entity.module';
import { AuthModule } from './module/auth.module';
import { AreaModule } from './module/area.module';
import { ProcedureModule } from './module/procedure.module';
import { RequestModule } from './module/request.module';

@Module({
  imports: [
    PassportModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
      expandVariables: true,
      validationOptions: {
        abortEarly: true,
      },
    }),
    EntityModule,
    AuthModule,
    AreaModule,
    ProcedureModule,
    RequestModule,
  ],

  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
