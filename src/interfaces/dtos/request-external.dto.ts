import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';

export class CreateRequestExternalDto {
  @ApiProperty()
  typeRequest: string;
  @ApiProperty()
  recipient: string;
  @ApiProperty()
  mailrecipient: string;
  @ApiProperty()
  maxResponseDays: string;
  @ApiProperty({ example: 'Solicitud de información' })
  subject: string;
  @ApiProperty({ example: { texto: 'Contenido en rich-text' }, type: Object })
  content: Prisma.InputJsonValue;
}

export class UpdateRequestExternalDto extends PartialType(
  CreateRequestExternalDto,
) {}
