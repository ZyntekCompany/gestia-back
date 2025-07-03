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
import { S3Service } from 'src/infrastructure/services/s3/s3.service';
import { RequestStatus } from '@prisma/client';
import type { InputJsonValue } from '@prisma/client/runtime/library';
import { JwtPayload } from 'src/types/express';
import { Request } from 'express';

@Controller('requests')
export class RequestController {
  constructor(
    private readonly assignAreaUC: AssignAreaUseCase,
    private readonly findHistoryUC: FindHistoryUseCase,
    private readonly s3Service: S3Service,
    private readonly prisma: PrismaService,
  ) {}

  // === CREAR SOLICITUD ===
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(AnyFilesInterceptor())
  async create(
    @Body() dto: CreateRequestDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: Request,
  ) {
    // Parsear content si viene como string
    let content = dto.content;
    if (typeof content === 'string') {
      try {
        content = JSON.parse(content) as unknown as InputJsonValue;
      } catch {
        throw new BadRequestException('El campo content debe ser JSON válido');
      }
    }

    const userId = (req.user as JwtPayload | undefined)?.sub;
    if (!userId) throw new BadRequestException('Usuario no autenticado');

    const procedure = await this.prisma.procedure.findUnique({
      where: { id: dto.procedureId },
      include: { area: true, entity: true },
    });
    if (!procedure || !procedure.areaId) {
      throw new BadRequestException('Trámite o área no encontrada');
    }

    const officers = await this.prisma.user.findMany({
      where: { areaId: procedure.areaId, role: 'OFFICER', active: true },
      orderBy: { createdAt: 'asc' },
    });
    if (!officers.length)
      throw new BadRequestException(
        'No hay funcionarios disponibles en el área',
      );

    const area = await this.prisma.area.findUnique({
      where: { id: procedure.areaId },
    });
    const nextIndex = (area?.lastAssignedIndex || 0) % officers.length;
    const assignedOfficer = officers[nextIndex];

    const { addDays } = await import('date-fns');
    const deadline = addDays(new Date(), procedure.maxResponseDays);

    const request = await this.prisma.request.create({
      data: {
        subject: dto.subject,
        content: content,
        status: 'ASSIGNED',
        procedureId: dto.procedureId,
        citizenId: userId,
        assignedToId: assignedOfficer.id,
        entityId: procedure.entityId,
        currentAreaId: procedure.areaId,
        deadline,
      },
    });

    await this.prisma.area.update({
      where: { id: area?.id },
      data: { lastAssignedIndex: nextIndex + 1 },
    });

    await this.prisma.requestUpdate.create({
      data: {
        requestId: request.id,
        updatedById: assignedOfficer.id,
        type: 'ASSIGNED',
        toAreaId: procedure.areaId,
        toUserId: assignedOfficer.id,
        message: 'Solicitud asignada automáticamente.',
      },
    });

    // Procesar archivos adjuntos
    const documents: any[] = [];
    if (files && files.length) {
      for (const file of files) {
        const url = await this.s3Service.uploadFile(file);
        const doc = await this.prisma.document.create({
          data: {
            name: file.originalname,
            url,
            requestId: request.id,
          },
        });
        documents.push(doc);
      }
    }

    return { request, documents };
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
    const userId = (req.user as JwtPayload | undefined)?.sub;
    const userRole = (req.user as JwtPayload | undefined)?.role;
    if (!userId) throw new BadRequestException('Usuario no autenticado');

    const request = await this.prisma.request.findUnique({
      where: { id },
    });
    if (!request) throw new BadRequestException('Request no encontrada');

    const isOwner = request.citizenId === userId;
    const isAssignedOfficer = request.assignedToId === userId;
    const isOfficer =
      userRole === 'OFFICER' || userRole === 'ADMIN' || userRole === 'SUPER';
    if (!isOwner && !isAssignedOfficer && !isOfficer) {
      throw new BadRequestException('No autorizado para responder');
    }

    let data = dto.data;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data) as unknown as InputJsonValue;
      } catch {
        throw new BadRequestException('El campo data debe ser JSON válido');
      }
    }

    const respuesta = await this.prisma.requestUpdate.create({
      data: {
        requestId: id,
        updatedById: userId,
        type: isOfficer ? 'RESPONSE' : 'USER_REPLY',
        message: dto.message,
        data: data,
      },
    });

    // Archivos adjuntos como respuesta
    const documents: any[] = [];
    if (files && files.length) {
      for (const file of files) {
        const url = await this.s3Service.uploadFile(file);
        const doc = await this.prisma.document.create({
          data: {
            name: file.originalname,
            url,
            requestId: id,
            requestUpdateId: respuesta.id, // <-- ¡Referencia a la respuesta!
          },
        });
        documents.push(doc);
      }
    }
    return { success: true, documents };
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
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const userRole = (req.user as JwtPayload | undefined)?.role;
    const userId = (req.user as JwtPayload | undefined)?.sub;

    if (!userRole || !['OFFICER', 'ADMIN', 'SUPER'].includes(userRole)) {
      throw new BadRequestException('No autorizado');
    }
    if (!userId) {
      throw new BadRequestException('Usuario no autenticado');
    }

    const skip = (page - 1) * limit;

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
        take: limit,
        include: {
          citizen: { select: { id: true, fullName: true, email: true } },
          procedure: { select: { id: true, name: true } },
          currentArea: { select: { id: true, name: true } },
          Document: true,
        },
      }),
    ]);

    return { total, page, limit, requests };
  }
}
