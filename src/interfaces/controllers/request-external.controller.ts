import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Req,
  Patch,
  Query,
} from '@nestjs/common';
import { CreateRequestExternalUseCase } from 'src/application/use-cases/request-external/create-request-external.use-case';
import { DeleteRequestExternalUseCase } from 'src/application/use-cases/request-external/delete-request-external.use-case';
import { FindAllRequestExternalUseCase } from 'src/application/use-cases/request-external/find-all-request-external.use-case';
import { FindOneRequestExternalUseCase } from 'src/application/use-cases/request-external/find-one-request-external.use-case';
import { CreateRequestExternalDto } from '../dtos/request-external.dto';
import { JwtAuthGuard } from 'src/infrastructure/guards/jwt.auth.guard';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { UpdateStatusRequestExternalUseCase } from 'src/application/use-cases/request-external/update-status-request-external.use-case';

@ApiTags('RequestExternal')
@Controller('request-external')
export class RequestExternalController {
  constructor(
    private readonly createRequestExternalUseCase: CreateRequestExternalUseCase,
    private readonly findAllRequestExternalUseCase: FindAllRequestExternalUseCase,
    private readonly findOneRequestExternalUseCase: FindOneRequestExternalUseCase,
    private readonly deleteRequestExternalUseCase: DeleteRequestExternalUseCase,
    private readonly updateStatusRequestExternalUseCase: UpdateStatusRequestExternalUseCase,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(AnyFilesInterceptor())
  create(
    @Body() createRequestExternalDto: CreateRequestExternalDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: Request,
  ) {
    return this.createRequestExternalUseCase.execute(
      createRequestExternalDto,
      req,
      files,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('subject') subject?: string,
    @Query('radicado') radicado?: string,
  ) {
    return this.findAllRequestExternalUseCase.execute(req, {
      page,
      limit,
      subject,
      radicado,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.findOneRequestExternalUseCase.execute(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.deleteRequestExternalUseCase.execute(id);
  }

  @Patch(':id/complete')
  @UseGuards(JwtAuthGuard)
  async updateStatus(@Param('id') id: string) {
    return this.updateStatusRequestExternalUseCase.execute(id);
  }
}
