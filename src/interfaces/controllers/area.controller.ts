import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';
import { CreateAreaUseCase } from 'src/application/use-cases/area/area.use-case';
import {
  CreateAreaRequestDto,
  CreateAreaResponseDto,
  DeleteAreaResponseDto,
  PaginatedAreasResponseDto,
  UpdateAreaRequestDto,
} from '../dtos/area.dto';
import { JwtAuthGuard } from 'src/infrastructure/guards/jwt.auth.guard';
import { ListAreasUseCase } from 'src/application/use-cases/area/list-areas.use-case';

@ApiTags('Area')
@Controller('area')
export class AreaController {
  constructor(
    private readonly createAreaUseCase: CreateAreaUseCase,
    private readonly listAreasUseCase: ListAreasUseCase,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Register a new area' })
  @ApiBody({ type: CreateAreaRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Area registered successfully',
    type: CreateAreaResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async register(
    @Body() request: CreateAreaRequestDto,
  ): Promise<CreateAreaResponseDto> {
    return this.createAreaUseCase.execute(request);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Actualizar área' })
  @ApiParam({ name: 'id', description: 'ID del área a actualizar' })
  @ApiBody({ type: UpdateAreaRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Área actualizada correctamente',
    type: CreateAreaResponseDto,
  })
  async update(@Param('id') id: string, @Body() dto: UpdateAreaRequestDto) {
    return this.createAreaUseCase.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Eliminar área' })
  @ApiParam({ name: 'id', description: 'ID del área a eliminar' })
  @ApiResponse({
    status: 200,
    description: 'Área eliminada correctamente',
    type: DeleteAreaResponseDto,
  })
  async delete(@Param('id') id: string) {
    return this.createAreaUseCase.delete(id);
  }

  @Get('entity/:entityId')
  @ApiOperation({ summary: 'Listar áreas de una entidad con paginación' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'name',
    required: false,
    type: String,
    example: 'Certificados',
  })
  @ApiResponse({ status: 200, type: PaginatedAreasResponseDto })
  async listAreas(
    @Param('entityId') entityId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
    @Query('name') name?: string,
  ): Promise<PaginatedAreasResponseDto> {
    const {
      data,
      total,
      page: currentPage,
      pageCount,
    } = await this.listAreasUseCase.execute(entityId, page, limit, name);
    return {
      data,
      total,
      page: currentPage,
      pageCount,
    };
  }
}
