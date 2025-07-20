// src/request/dto/create-request.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { RequestStatus } from '@prisma/client';

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

export class UnifiedRequestsFilterDto {
  @ApiProperty({ required: false, description: 'Número de página', example: 1 })
  page?: number;

  @ApiProperty({
    required: false,
    description: 'Elementos por página',
    example: 10,
  })
  limit?: number;

  @ApiProperty({ required: false, description: 'Filtrar por radicado' })
  radicado?: string;

  @ApiProperty({ required: false, description: 'Filtrar por asunto' })
  subject?: string;

  @ApiProperty({
    required: false,
    enum: RequestStatus,
    description: 'Filtrar por estado',
  })
  status?: RequestStatus;

  @ApiProperty({
    required: false,
    description: 'Tipo de solicitud: "internal" o "external"',
    example: 'internal',
  })
  type?: 'internal' | 'external';
}

export class UnifiedRequestsResponseDto {
  @ApiProperty({ description: 'Datos de las solicitudes' })
  data: any[];

  @ApiProperty({ description: 'Total de registros' })
  total: number;

  @ApiProperty({ description: 'Página actual' })
  page: number;

  @ApiProperty({ description: 'Total de páginas' })
  pageCount: number;

  @ApiProperty({ description: 'Elementos por página' })
  limit: number;
}
