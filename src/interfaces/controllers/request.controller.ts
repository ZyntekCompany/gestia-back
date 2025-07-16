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
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/infrastructure/guards/jwt.auth.guard';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import {
  AssignAreaDto,
  CreateRequestDto,
  RespondRequestDto,
} from '../dtos/request.dto';
import { AssignAreaUseCase } from 'src/application/use-cases/request/assign-area.use-case';
import { FindHistoryUseCase } from 'src/application/use-cases/request/find-history.usecase';
import { RequestStatus } from '@prisma/client';
import { JwtPayload } from 'src/types/express';
import { Request } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { PrismaRequestRepository } from 'src/infrastructure/repositories/prisma-request.repository';
import { CreateRequesUseCase } from 'src/application/use-cases/request/created-request.use-case';
import { RequesReplyUseCase } from 'src/application/use-cases/request/request-reply.use-case';

@ApiTags('Requests')
@Controller('requests')
export class RequestController {
  constructor(
    private readonly assignAreaUC: AssignAreaUseCase,
    private readonly createRequesUseCase: CreateRequesUseCase,
    private readonly requesReplyUseCase: RequesReplyUseCase,
    private readonly prismaRequestRepository: PrismaRequestRepository,
    private readonly findHistoryUC: FindHistoryUseCase,
    private readonly prisma: PrismaService,
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

    const where: { assignedToId: string; status?: RequestStatus } = {
      assignedToId: userId,
    };
    if (status) where.status = status as RequestStatus;

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
    const userRole = (req.user as JwtPayload | undefined)?.role;
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
