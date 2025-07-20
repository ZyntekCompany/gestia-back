import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  RestoreObjectCommand,
  HeadObjectCommand,
  HeadObjectCommandOutput,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import * as sharp from 'sharp';

@Injectable()
export class S3Service {
  private readonly s3: S3Client;
  private readonly logger = new Logger(S3Service.name);

  constructor() {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const allowedTypes = [
      'image/',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    const isAllowed = allowedTypes.some((type) =>
      file.mimetype.startsWith(type),
    );
    if (!isAllowed) {
      throw new Error('Tipo de archivo no permitido');
    }

    const originalFileName = file.originalname
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^\w.-]/g, '');

    let bufferToUpload: Buffer = file.buffer;
    let contentType = file.mimetype;
    let finalFileName = originalFileName;

    if (file.mimetype.startsWith('image/')) {
      bufferToUpload = await sharp(file.buffer)
        .webp({ quality: 75 })
        .toBuffer();

      contentType = 'image/webp';
      finalFileName = originalFileName.replace(/\.[^.]+$/, '.webp');
    }

    const key = `entity/${uuidv4()}-${finalFileName}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: key,
        Body: bufferToUpload,
        ContentType: contentType,
      }),
    );

    return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${key}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const key = this.extractKeyFromUrl(fileUrl);
      this.logger.log(`Eliminando archivo: ${key}`);

      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME!,
          Key: key,
        }),
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `Error al eliminar archivo S3: ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error(
          'Error desconocido al eliminar archivo S3',
          JSON.stringify(error),
        );
      }
    }
  }

  async restoreFileIfArchived(fileUrl: string): Promise<void> {
    const key = this.extractKeyFromUrl(fileUrl);

    try {
      const head: HeadObjectCommandOutput = await this.s3.send(
        new HeadObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME!,
          Key: key,
        }),
      );

      const storageClass = head.StorageClass;

      // Si está en Glacier o Deep Archive, restaurar
      if (storageClass === 'GLACIER' || storageClass === 'DEEP_ARCHIVE') {
        const isRestoreInProgress = head.Restore?.includes(
          'ongoing-request="true"',
        );

        if (!isRestoreInProgress) {
          this.logger.warn(
            `Archivo archivado (${storageClass}). Iniciando restauración: ${key}`,
          );

          await this.s3.send(
            new RestoreObjectCommand({
              Bucket: process.env.AWS_S3_BUCKET_NAME!,
              Key: key,
              RestoreRequest: {
                Days: 3, // Disponible durante 3 días
                GlacierJobParameters: {
                  Tier: 'Standard', // Puede ser 'Bulk' o 'Expedited'
                },
              },
            }),
          );

          this.logger.log(`Restauración solicitada para: ${key}`);
        } else {
          this.logger.log(`Restauración ya en progreso para: ${key}`);
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `Error al verificar o restaurar archivo: ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error(
          'Error desconocido al verificar/restaurar archivo',
          JSON.stringify(error),
        );
      }
    }
  }

  private extractKeyFromUrl(fileUrl: string): string {
    return decodeURIComponent(new URL(fileUrl).pathname.slice(1));
  }
}
