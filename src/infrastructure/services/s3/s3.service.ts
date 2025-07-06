import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import * as sharp from 'sharp';

@Injectable()
export class S3Service {
  private readonly s3: S3Client;

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

    // Validación MIME type permitido
    const isAllowed = allowedTypes.some((type) =>
      file.mimetype.startsWith(type),
    );
    if (!isAllowed) {
      throw new Error('Tipo de archivo no permitido');
    }

    // Usar el nombre original tal cual
    const originalFileName = file.originalname
      .trim()
      .replace(/\s+/g, '_') // Reemplaza espacios por guión bajo
      .replace(/[^\w.-]/g, ''); // Elimina caracteres raros o inseguros

    let bufferToUpload: Buffer = file.buffer;
    let contentType = file.mimetype;
    let finalFileName = originalFileName;

    // Si es imagen, convertir a WebP
    if (file.mimetype.startsWith('image/')) {
      bufferToUpload = await sharp(file.buffer)
        .webp({ quality: 75 })
        .toBuffer();

      contentType = 'image/webp';
      // Cambiar solo la extensión, mantener el nombre base
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

    const url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${key}`;
    return url;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const key = decodeURIComponent(new URL(fileUrl).pathname.slice(1));
      console.log('S3 Key to delete:', key);

      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME!,
          Key: key,
        }),
      );
    } catch (error) {
      console.error('Error deleting file from S3:', error);
    }
  }
}
