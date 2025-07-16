// src/request/dto/create-request.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';

export class CreateRequestDto {
  @ApiProperty({ example: 'Solicitud de información' })
  subject: string;

  @ApiProperty({ example: { texto: 'Contenido en rich-text' }, type: Object })
  content: Prisma.InputJsonValue;

  @ApiProperty({ example: 'uuid-del-procedimiento' })
  procedureId: string;
}

export class AssignAreaDto {
  @ApiProperty({ example: 'uuid-del-area' })
  toAreaId: string;

  @ApiProperty({ example: 'Mensaje de asignación' })
  message?: string;
}

export class RespondRequestDto {
  @ApiProperty({ example: 'Mensaje de respuesta' })
  message: string;

  @ApiProperty({ example: { texto: 'Contenido en rich-text' }, type: Object })
  data?: Prisma.InputJsonValue;
}
