import { Module } from '@nestjs/common';
import { S3Service } from './s3.service';
import { ArchivosController } from 'src/interfaces/controllers/archivos.controller';

@Module({
  controllers: [ArchivosController],
  providers: [S3Service],
  exports: [S3Service],
})
export class S3Module {}
