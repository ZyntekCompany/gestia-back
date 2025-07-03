// src/interfaces/dtos/procedure.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProcedureRequestDto {
  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  maxResponseDays: number;

  @ApiProperty()
  entityId: string;

  @ApiPropertyOptional()
  areaId?: string;
}

export class CreateProcedureResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  maxResponseDays: number;

  @ApiProperty()
  entityId: string;

  @ApiPropertyOptional()
  areaId?: string;
}

export class UpdateProcedureRequestDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  maxResponseDays?: number;

  @ApiPropertyOptional()
  areaId?: string;
}

export class DeleteProcedureRequestDto {
  @ApiProperty()
  id: string;
}
