import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
