import { Controller, Get, Query } from '@nestjs/common';
import { S3Service } from 'src/infrastructure/services/s3/s3.service';

@Controller('archivos')
export class ArchivosController {
  constructor(private readonly s3Service: S3Service) {}

  @Get('verificar-o-restaurar')
  async verificarArchivo(@Query('url') fileUrl: string) {
    await this.s3Service.restoreFileIfArchived(fileUrl);
    return {
      mensaje:
        'Verificación completada. Si estaba archivado, se inició restauración.',
    };
  }
}
