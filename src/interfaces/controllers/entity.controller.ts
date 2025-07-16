import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Param,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CreateEntityUseCase } from 'src/application/use-cases/entity/create-entity.use-case';
import {
  CreateEntityRequestDto,
  CreateEntityResponseDto,
  UpdateEntityRequestDto,
} from '../dtos/entity.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/infrastructure/guards/jwt.auth.guard';
import { Request } from 'express';
import { UpdateEntityUseCase } from 'src/application/use-cases/entity/update-entity.use-case';
import { TypeEntity } from '@prisma/client';
import { ListEntityUseCase } from 'src/application/use-cases/entity/list-entity.use-case';

@ApiTags('Entity')
@Controller('entity')
export class Entityontroller {
  constructor(
    private readonly createEntityUseCase: CreateEntityUseCase,
    private readonly listEntityUseCase: ListEntityUseCase,
    private readonly udpateEntityUseCase: UpdateEntityUseCase,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Datos para crear un colegio y su imagen',
    type: CreateEntityRequestDto,
  })
  @UseInterceptors(FileInterceptor('imgUrl'))
  async createEntity(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // 5MB
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() createEntityDto: CreateEntityRequestDto,
    @Req() req: Request,
  ): Promise<CreateEntityResponseDto> {
    createEntityDto.user = req.user as CreateEntityRequestDto['user'];
    return this.createEntityUseCase.execute(createEntityDto, file);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Datos para actualizar un colegio y su imagen',
    type: UpdateEntityRequestDto,
  })
  @UseInterceptors(FileInterceptor('imgUrl'))
  async updateEntity(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // 5MB
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
        ],
        fileIsRequired: false,
      }),
    )
    file: Express.Multer.File,
    @Body() updateEntityDto: UpdateEntityRequestDto,
    @Req() req: Request,
  ): Promise<CreateEntityResponseDto> {
    updateEntityDto.user = req.user as UpdateEntityRequestDto['user'];
    return this.udpateEntityUseCase.Update(id, updateEntityDto, file);
  }

  @Get('types')
  @ApiOperation({ summary: 'Listar tipos de entidad' })
  getTypes() {
    return {
      types: Object.values(TypeEntity),
    };
  }

  @Get()
  @ApiOperation({ summary: 'Listar entidades filtradas y paginadas' })
  @ApiQuery({ name: 'type', enum: TypeEntity, required: true })
  @ApiQuery({ name: 'name', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  getEntities(
    @Query('type') type: TypeEntity,
    @Query('name') name?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.listEntityUseCase.execute({
      type,
      name,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
    });
  }
}
