import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateAreaUseCase } from 'src/application/use-cases/area/area.use-case';
import {
  CreateAreaRequestDto,
  CreateAreaResponseDto,
  DeleteAreaRequestDto,
  DeleteAreaResponseDto,
  UpdateAreaRequestDto,
} from '../dtos/area.dto';
import { JwtAuthGuard } from 'src/infrastructure/guards/jwt.auth.guard';

@ApiTags('area')
@Controller('area')
export class AreaController {
  constructor(private readonly createAreaUseCase: CreateAreaUseCase) {}

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

  @Patch()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Actualizar área' })
  @ApiBody({ type: UpdateAreaRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Área actualizada correctamente',
    type: CreateAreaResponseDto,
  })
  async update(@Body() dto: UpdateAreaRequestDto) {
    return this.createAreaUseCase.update(dto);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Eliminar área' })
  @ApiBody({ type: DeleteAreaRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Área eliminada correctamente',
    type: DeleteAreaResponseDto,
  })
  async delete(@Body() dto: DeleteAreaRequestDto) {
    return this.createAreaUseCase.delete(dto.id);
  }
}
