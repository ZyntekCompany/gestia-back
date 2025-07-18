import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { RequestExternalController } from 'src/interfaces/controllers/request-external.controller';
import { PrismaRequestExternalRepository } from 'src/infrastructure/repositories/prisma-request-external.repository';
import { CreateRequestExternalUseCase } from 'src/application/use-cases/request-external/create-request-external.use-case';
import { FindAllRequestExternalUseCase } from 'src/application/use-cases/request-external/find-all-request-external.use-case';
import { FindOneRequestExternalUseCase } from 'src/application/use-cases/request-external/find-one-request-external.use-case';
import { DeleteRequestExternalUseCase } from 'src/application/use-cases/request-external/delete-request-external.use-case';
import { UpdateStatusRequestExternalUseCase } from 'src/application/use-cases/request-external/update-status-request-external.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [RequestExternalController],
  providers: [
    {
      provide: 'RequestExternalRepository',
      useClass: PrismaRequestExternalRepository,
    },
    CreateRequestExternalUseCase,
    FindAllRequestExternalUseCase,
    FindOneRequestExternalUseCase,
    DeleteRequestExternalUseCase,
    UpdateStatusRequestExternalUseCase,
  ],
})
export class RequestExternalModule {}
