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

  @ApiPropertyOptional()
  pqrsType?: string;
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

  @ApiPropertyOptional()
  pqrsType?: string;
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

  @ApiPropertyOptional()
  pqrsType?: string;
}

export class DeleteProcedureRequestDto {
  @ApiProperty()
  id: string;
}

export class ListProcedureByAreaResponseDto {
  id: string;
  name: string;
  description: string;
  maxResponseDays: number;
  entityId: string;
  areaId: string;
  pqrsType: string;
}
