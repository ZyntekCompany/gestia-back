import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateProcedureUseCase } from 'src/application/use-cases/procedure/create-procedure.use-case';
import {
  CreateProcedureRequestDto,
  CreateProcedureResponseDto,
  ListProcedureByAreaResponseDto,
  UpdateProcedureRequestDto,
} from '../dtos/procedure.dto';
import { JwtAuthGuard } from 'src/infrastructure/guards/jwt.auth.guard';
import { UpdateProcedureUseCase } from 'src/application/use-cases/procedure/update-procedure.use-case';
import { DeleteProcedureUseCase } from 'src/application/use-cases/procedure/delete-procedure.use-case';
import { ListProcedureByAreaUseCase } from 'src/application/use-cases/procedure/list-by-area.use-case';
import { Request } from 'express';
import { JwtPayload } from 'src/types/express';

@ApiTags('Procedure')
@Controller('procedure')
export class ProcedureController {
  constructor(
    private readonly createProcedureUseCase: CreateProcedureUseCase,
    private readonly updateProcedureUseCase: UpdateProcedureUseCase,
    private readonly deleteProcedureUseCase: DeleteProcedureUseCase,
    private readonly listProcedureByAreaUseCase: ListProcedureByAreaUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Registrar un nuevo procedimiento' })
  @ApiBody({ type: CreateProcedureRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Procedimiento registrado exitosamente',
    type: CreateProcedureResponseDto,
  })
  async create(@Body() request: CreateProcedureRequestDto) {
    return this.createProcedureUseCase.execute(request);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar un procedimiento' })
  @ApiBody({ type: UpdateProcedureRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Procedimiento actualizado exitosamente',
    type: CreateProcedureResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() request: UpdateProcedureRequestDto,
  ) {
    return this.updateProcedureUseCase.execute({ ...request, id });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar un procedimiento' })
  @ApiResponse({
    status: 200,
    description: 'Procedimiento eliminado exitosamente',
  })
  async delete(@Param('id') id: string) {
    await this.deleteProcedureUseCase.execute(id);
    return { message: 'Procedimiento eliminado exitosamente' };
  }

  @Get('by-area/:areaId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener procedimientos por entity' })
  @ApiResponse({
    status: 200,
    description: 'Lista de procedimientos',
    type: ListProcedureByAreaResponseDto,
    isArray: true,
  })
  async findByArea(@Param('areaId') areaId: string) {
    return this.listProcedureByAreaUseCase.execute(areaId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'ver procedimiento por id de entidad' })
  @ApiResponse({
    status: 200,
    description: 'Procedimiento eliminado exitosamente',
  })
  async GetEntityID(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as JwtPayload;
    return await this.listProcedureByAreaUseCase.executedEntityID(id, user);
  }
}
