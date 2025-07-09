import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AreaDto } from './user.dto';

export class CreateAreaRequestDto {
  @ApiProperty({ example: 'Escuela Nacional de Ciencias' })
  name: string;
  @ApiProperty({ example: 'Escuela Nacional de Ciencias' })
  entityId: string;
}

export class CreateAreaResponseDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  name: string;
  @ApiProperty()
  entityId: string;
}

export class UpdateAreaRequestDto {
  @ApiProperty()
  id: string;
  @ApiPropertyOptional()
  name?: string;
}

export class DeleteAreaRequestDto {
  @ApiProperty()
  id: string;
}

export class DeleteAreaResponseDto {
  @ApiProperty()
  message: string;
}

export class PaginatedAreasResponseDto {
  @ApiProperty({ type: [AreaDto] })
  data: AreaDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageCount: number;
}
