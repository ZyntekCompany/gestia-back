import {
  Query,
  UseGuards,
  Controller,
  Get,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { GetEntityKpisUseCase } from 'src/application/use-cases/analitys/get-kpis.use-case';
import { JwtAuthGuard } from 'src/infrastructure/guards/jwt.auth.guard';
import { EntityKpiQueryDto } from '../dtos/anality.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtPayload } from 'src/types/express';
import { GetRequestsByAreaUseCase } from 'src/application/use-cases/analitys/get-area.use-case';
import { GetRequestsByStatusUseCase } from 'src/application/use-cases/analitys/get-requests-by-status.use-case';
import { GetLatestActivitiesUseCase } from 'src/application/use-cases/analitys/get-latest-activities-use-case';
import { GetRequestsTrendUseCase } from 'src/application/use-cases/analitys/get-requests-trend.use-case';

@ApiTags('Analitys')
@Controller('analitys')
export class AnalitysController {
  constructor(
    private readonly getEntityKpisUseCase: GetEntityKpisUseCase,
    private readonly getRequestsByAreaUseCase: GetRequestsByAreaUseCase,
    private readonly getRequestsByStatusUseCase: GetRequestsByStatusUseCase,
    private readonly getLatestRequestsUseCase: GetLatestActivitiesUseCase,
    private readonly getRequestsTrendUseCase: GetRequestsTrendUseCase,
  ) {}

  @Get('kpis')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kpis solo para admins' })
  @UseGuards(JwtAuthGuard)
  async getKpis(@Query() query: EntityKpiQueryDto, @Req() req: Request) {
    const userId = (req.user as JwtPayload | undefined)?.sub;
    if (!userId) throw new BadRequestException('Usuario no autenticado');
    return this.getEntityKpisUseCase.execute(
      userId,
      query.startDate,
      query.endDate,
    );
  }

  @Get('area-chart')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Area chart solo para admins' })
  @UseGuards(JwtAuthGuard)
  async getRequestsByArea(@Req() req: Request) {
    const userId = (req.user as JwtPayload | undefined)?.sub;
    if (!userId) throw new BadRequestException('Usuario no autenticado');
    return this.getRequestsByAreaUseCase.execute(userId);
  }

  @Get('requests-by-status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Requests by status solo para admins' })
  @UseGuards(JwtAuthGuard)
  async getRequestsByStatus(@Req() req: Request) {
    const userId = (req.user as JwtPayload | undefined)?.sub;
    if (!userId) throw new BadRequestException('Usuario no autenticado');
    return this.getRequestsByStatusUseCase.execute(userId);
  }

  @Get('latest-requests')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Latest requests solo para admins' })
  @UseGuards(JwtAuthGuard)
  async getLatestRequests(@Req() req: Request) {
    const userId = (req.user as JwtPayload | undefined)?.sub;
    if (!userId) throw new BadRequestException('Usuario no autenticado');
    return this.getLatestRequestsUseCase.execute(userId);
  }

  @Get('requests-trend')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Requests trend solo para admins' })
  @UseGuards(JwtAuthGuard)
  async getRequestsTrend(
    @Req() req: Request,
    @Query() query: { from?: string; to?: string },
  ) {
    const userId = (req.user as JwtPayload | undefined)?.sub;
    if (!userId) throw new BadRequestException('Usuario no autenticado');
    return this.getRequestsTrendUseCase.execute(
      userId,
      query.from ? new Date(query.from) : undefined,
      query.to ? new Date(query.to) : undefined,
    );
  }
}
