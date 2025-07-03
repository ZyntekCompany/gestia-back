import { ApiProperty } from '@nestjs/swagger';
import { TypeEntity } from '@prisma/client';
import { JwtPayload } from 'src/types/express';

export class CreateEntityRequestDto {
  user: JwtPayload;
  @ApiProperty({ example: 'Escuela Nacional de Ciencias' })
  name: string;
  @ApiProperty({ example: 'Francisco Morazán' })
  type: TypeEntity;
  @ApiProperty()
  active: boolean;
  @ApiProperty({ example: 'Calle 123, Barrio Centro' })
  description?: string;
  @ApiProperty({ example: '+50498765432' })
  phone?: string;
  @ApiProperty({ example: 'Francisco Morazán' })
  imgUrl?: string;
}

export class CreateEntityResponseDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  name: string;
  @ApiProperty()
  type: string;
  @ApiProperty()
  imgUrl: string;
  @ApiProperty()
  active: boolean;
  @ApiProperty()
  description: string;
  @ApiProperty()
  phone: string;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  updatedAt: Date;
}

export class UpdateEntityRequestDto {
  @ApiProperty({ example: '' })
  id: string;
  user: JwtPayload;
  @ApiProperty({ example: 'Escuela Nacional de Ciencias' })
  name?: string;
  @ApiProperty({ example: 'Calle 123, Barrio Centro' })
  description?: string;
  @ApiProperty({ example: '+50498765432' })
  phone?: string;
  @ApiProperty({ example: 'Francisco Morazán' })
  imgUrl?: string;
  @ApiProperty({ example: 'Francisco Morazán' })
  type?: TypeEntity;
  @ApiProperty()
  active: boolean;
}
