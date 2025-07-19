import { ApiProperty } from '@nestjs/swagger';

export class EntityKpiQueryDto {
  @ApiProperty({ required: false })
  startDate?: string; // formato ISO opcional

  @ApiProperty({ required: false })
  endDate?: string; // formato ISO opcional
}
