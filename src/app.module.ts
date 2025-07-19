// src/app.module.ts
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { GlobalModule } from './module/core/core.module';
import { EntityModule } from './module/entity.module';
import { AuthModule } from './module/auth.module';
import { AreaModule } from './module/area.module';
import { ProcedureModule } from './module/procedure.module';
import { RequestModule } from './module/request.module';
import { UserModule } from './module/user.module';
import { ScheduleModule } from '@nestjs/schedule';
import { IaModule } from './module/ia.module';
import { RequestExternalModule } from './module/request-external.module';
import { AnalitysModule } from './module/analitys.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
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
    GlobalModule, // SOLO aquí
    EntityModule,
    AuthModule,
    AreaModule,
    ProcedureModule,
    RequestModule,
    UserModule,
    IaModule,
    RequestExternalModule,
    AnalitysModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
