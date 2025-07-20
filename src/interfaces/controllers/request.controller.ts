import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Patch,
  Param,
  Get,
  BadRequestException,
  Query,
  Res,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/infrastructure/guards/jwt.auth.guard';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import {
  AssignAreaDto,
  CreateRequestDto,
  RespondRequestDto,
  UnifiedRequestsFilterDto,
} from '../dtos/request.dto';
import { AssignAreaUseCase } from 'src/application/use-cases/request/assign-area.use-case';
import { FindHistoryUseCase } from 'src/application/use-cases/request/find-history.usecase';
import { RequestStatus } from '@prisma/client';
import { JwtPayload } from 'src/types/express';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { PrismaRequestRepository } from 'src/infrastructure/repositories/prisma-request.repository';
import { CreateRequesUseCase } from 'src/application/use-cases/request/created-request.use-case';
import { RequesReplyUseCase } from 'src/application/use-cases/request/request-reply.use-case';
import { FindUnifiedRequestsUseCase } from 'src/application/use-cases/request/find-unified-requests.use-case';
import { GenerateExcelReportUseCase } from 'src/application/use-cases/request/generate-excel-report.use-case';
import { Prisma } from '@prisma/client';
import { RequestsGateway } from 'src/infrastructure/services/webSocket-gateway.service';

@ApiTags('Requests')
@Controller('requests')
export class RequestController {
  constructor(
    private readonly assignAreaUC: AssignAreaUseCase,
    private readonly createRequesUseCase: CreateRequesUseCase,
    private readonly requesReplyUseCase: RequesReplyUseCase,
    private readonly findUnifiedRequestsUseCase: FindUnifiedRequestsUseCase,
    private readonly generateExcelReportUseCase: GenerateExcelReportUseCase,
    private readonly prismaRequestRepository: PrismaRequestRepository,
    private readonly findHistoryUC: FindHistoryUseCase,
    private readonly prisma: PrismaService,
    private readonly gateway: RequestsGateway, // 👈 nuevo
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(AnyFilesInterceptor())
  async create(
    @Body() dto: CreateRequestDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: Request,
  ) {
    return this.createRequesUseCase.create(dto, req, files);
  }

  // === BÚSQUEDA UNIFICADA DE SOLICITUDES (INTERNAS Y EXTERNAS) ===
  @Get('reportes')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Buscar solicitudes unificadas',
    description:
      'Obtiene solicitudes internas y externas con filtros y paginación',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Número de página',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Elementos por página',
  })
  @ApiQuery({
    name: 'radicado',
    required: false,
    description: 'Filtrar por radicado',
  })
  @ApiQuery({
    name: 'subject',
    required: false,
    description: 'Filtrar por asunto',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PENDING', 'IN_REVIEW', 'COMPLETED', 'OVERDUE'],
    description: 'Filtrar por estado',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['internal', 'external'],
    description: 'Tipo de solicitud',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de solicitudes unificadas',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              radicado: { type: 'string' },
              subject: { type: 'string' },
              status: { type: 'string' },
              type: { type: 'string', enum: ['internal', 'external'] },
              createdAt: { type: 'string', format: 'date-time' },
              citizen: { type: 'object' },
              assignedTo: { type: 'object' },
              procedure: { type: 'object' },
              entity: { type: 'object' },
              currentArea: { type: 'object' },
              Document: { type: 'array' },
            },
          },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        pageCount: { type: 'number' },
        limit: { type: 'number' },
      },
    },
  })
  async getUnifiedRequests(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('radicado') radicado?: string,
    @Query('subject') subject?: string,
    @Query('status') status?: string,
    @Query('type') type?: 'internal' | 'external',
  ) {
    const userId = (req.user as JwtPayload | undefined)?.sub;
    if (!userId) {
      throw new BadRequestException('Usuario no autenticado');
    }

    const filters: UnifiedRequestsFilterDto = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      radicado,
      subject,
      status: status as RequestStatus,
      type,
    };

    return this.findUnifiedRequestsUseCase.execute(filters, userId);
  }

  // === GENERAR REPORTE EXCEL ===
  @Get('reportes/excel')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Generar reporte Excel de solicitudes',
    description:
      'Genera un archivo Excel con todas las solicitudes internas y externas según los filtros aplicados',
  })
  @ApiQuery({
    name: 'radicado',
    required: false,
    description: 'Filtrar por radicado',
  })
  @ApiQuery({
    name: 'subject',
    required: false,
    description: 'Filtrar por asunto',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PENDING', 'IN_REVIEW', 'COMPLETED', 'OVERDUE'],
    description: 'Filtrar por estado',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['internal', 'external'],
    description: 'Tipo de solicitud',
  })
  @ApiResponse({
    status: 200,
    description: 'Archivo Excel generado exitosamente',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async generateExcelReport(
    @Res() res: Response,
    @Req() req: Request,
    @Query('radicado') radicado?: string,
    @Query('subject') subject?: string,
    @Query('status') status?: string,
    @Query('type') type?: 'internal' | 'external',
  ) {
    const userId = (req.user as JwtPayload | undefined)?.sub;
    if (!userId) {
      throw new BadRequestException('Usuario no autenticado');
    }

    const filters: UnifiedRequestsFilterDto = {
      page: 1,
      limit: 10000, // Límite alto para obtener todos los datos
      radicado,
      subject,
      status: status as RequestStatus,
      type,
    };

    const excelBuffer = await this.generateExcelReportUseCase.execute(
      filters,
      userId,
    );

    // Configurar headers para descarga
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `reporte_solicitudes_${timestamp}.xlsx`;

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': excelBuffer.length,
    });

    res.send(excelBuffer);
  }

  // === DERIVAR/ASIGNAR ÁREA ===
  @Patch(':id/assign-area')
  @UseGuards(JwtAuthGuard)
  async assignArea(
    @Param('id') id: string,
    @Body() dto: AssignAreaDto,
    @Req() req: Request,
  ) {
    const userId = (req.user as JwtPayload | undefined)?.sub;
    if (!userId) throw new BadRequestException('Usuario no autenticado');
    await this.assignAreaUC.execute(id, userId, dto);
    return { success: true };
  }

  // === RESPONDER SOLICITUD ===
  @Post(':id/reply')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(AnyFilesInterceptor())
  async reply(
    @Param('id') id: string,
    @Body() dto: RespondRequestDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: Request,
  ) {
    return this.requesReplyUseCase.create(id, dto, req, files);
  }

  // === HISTORIAL DE UNA SOLICITUD ===
  @Get(':id/history')
  @UseGuards(JwtAuthGuard)
  async getHistory(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as JwtPayload | undefined)?.sub;
    return this.findHistoryUC.execute(id, userId);
  }

  // === LISTADO DE SOLICITUDES ASIGNADAS A FUNCIONARIO (PAGINADO) ===
  @Get('my-assigned')
  @UseGuards(JwtAuthGuard)
  async getAssignedRequests(
    @Req() req: Request,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('subject') subject?: string,
    @Query('radicado') radicado?: string,
  ) {
    const userRole = (req.user as JwtPayload | undefined)?.role;
    const userId = (req.user as JwtPayload | undefined)?.sub;

    if (!userRole || !['OFFICER', 'ADMIN', 'SUPER'].includes(userRole)) {
      throw new BadRequestException('No autorizado');
    }
    if (!userId) {
      throw new BadRequestException('Usuario no autenticado');
    }

    const pageNumber = parseInt(page ?? '1', 10);
    const limitNumber = parseInt(limit ?? '10', 10);
    const skip = (pageNumber - 1) * limitNumber;

    const where: Prisma.RequestWhereInput = {
      assignedToId: userId,
    };
    if (status) where.status = status as RequestStatus;
    if (subject) where.subject = { contains: subject, mode: 'insensitive' };
    if (radicado) where.radicado = { contains: radicado, mode: 'insensitive' };

    const [total, requests] = await Promise.all([
      this.prisma.request.count({ where }),
      this.prisma.request.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNumber, // <-- ahora es un número
        include: {
          citizen: true,
          procedure: { select: { id: true, name: true } },
          currentArea: { select: { id: true, name: true } },
          Document: true,
        },
      }),
    ]);

    return {
      data: requests,
      total,
      page: pageNumber,
      pageCount: Math.ceil(total / limitNumber),
    };
  }

  @Get('my-assigned/count-by-status')
  @UseGuards(JwtAuthGuard)
  async getAssignedRequestCounts(@Req() req: Request) {
    const userRole = (req.user as JwtPayload | undefined)?.role;
    const userId = (req.user as JwtPayload | undefined)?.sub;

    const allStatuses: RequestStatus[] = [
      'PENDING',
      'IN_REVIEW',
      'COMPLETED',
      'OVERDUE',
    ];

    if (!userRole || !['OFFICER', 'ADMIN', 'SUPER'].includes(userRole)) {
      throw new BadRequestException('No autorizado');
    }
    if (!userId) {
      throw new BadRequestException('Usuario no autenticado');
    }

    const counts = await this.prisma.request.groupBy({
      by: ['status'],
      where: { assignedToId: userId },
      _count: true,
    });

    // Opcional: transformar la respuesta a un objeto más limpio
    const result = Object.fromEntries(
      allStatuses.map((status) => [
        status,
        counts.find((c) => c.status === status)?._count ?? 0,
      ]),
    );

    try {
      this.gateway.emitRequestUpdate(userId, result);
    } catch (error) {
      console.warn('Error al emitir WebSocket:', error);
    }
    return result;
  }

  @Patch(':id/complete')
  @UseGuards(JwtAuthGuard)
  async completeRequest(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as JwtPayload | undefined)?.sub;
    if (!userId) throw new BadRequestException('Usuario no autenticado');
    await this.prismaRequestRepository.completeRequest(id, userId);
    return { success: true };
  }

  @Get('my-requests')
  @UseGuards(JwtAuthGuard)
  async getMyRequests(
    @Req() req: Request,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = (req.user as JwtPayload | undefined)?.sub;

    if (!userId) {
      throw new BadRequestException('No autorizado');
    }

    const pageNumber = parseInt(page ?? '1', 10);
    const limitNumber = parseInt(limit ?? '10', 10);
    const skip = (pageNumber - 1) * limitNumber;

    const where: { citizenId: string; status?: RequestStatus } = {
      citizenId: userId,
    };
    if (status) where.status = status as RequestStatus;

    const [total, requests] = await Promise.all([
      this.prisma.request.count({ where }),
      this.prisma.request.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNumber,
        include: {
          assignedTo: { select: { id: true, fullName: true, email: true } },
          procedure: { select: { id: true, name: true } },
          currentArea: { select: { id: true, name: true } },
          Document: true,
        },
      }),
    ]);

    return {
      data: requests,
      total,
      page: pageNumber,
      pageCount: Math.ceil(total / limitNumber),
    };
  }
  // === CONTAR SOLICITUDES DEL CIUDADANO POR ESTADO ===
  @Get('my-requests/count-by-status')
  @UseGuards(JwtAuthGuard)
  async getMyRequestCounts(@Req() req: Request) {
    const userId = (req.user as JwtPayload | undefined)?.sub;

    const allStatuses: RequestStatus[] = [
      'PENDING',
      'IN_REVIEW',
      'COMPLETED',
      'OVERDUE',
    ];

    if (!userId) {
      throw new BadRequestException('No autorizado');
    }

    const counts = await this.prisma.request.groupBy({
      by: ['status'],
      where: { citizenId: userId },
      _count: true,
    });

    const result = Object.fromEntries(
      allStatuses.map((status) => [
        status,
        counts.find((c) => c.status === status)?._count ?? 0,
      ]),
    );

    return result;
  }
}
