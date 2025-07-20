import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { UnifiedRequestsFilterDto } from 'src/interfaces/dtos/request.dto';
import * as ExcelJS from 'exceljs';

interface RequestWithRelations {
  id: string;
  radicado: string | null;
  subject: string;
  status: string;
  createdAt: Date;
  deadline: Date;
  type: 'internal' | 'external';
  citizen?: {
    id: string;
    fullName: string;
    email: string;
  };
  User?: {
    id: string;
    fullName: string;
    email: string;
  };
  assignedTo?: {
    id: string;
    fullName: string;
    email: string;
  };
  procedure?: {
    id: string;
    name: string;
  };
  entity?: {
    id: string;
    name: string;
  };
  currentArea?: {
    id: string;
    name: string;
  };
  Document?: Array<{ id: string; name: string; url: string }>;
}

@Injectable()
export class GenerateExcelReportUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    filters: UnifiedRequestsFilterDto,
    userId: string,
  ): Promise<Buffer> {
    // Obtener la entidad del usuario
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { entityId: true },
    });

    if (!user?.entityId) {
      throw new Error('Usuario no tiene entidad asignada');
    }
    // Construir filtros para Request
    const requestWhere: Record<string, any> = {
      entityId: user.entityId, // Filtrar por entidad del usuario
    };
    if (filters.radicado) {
      requestWhere.radicado = {
        contains: filters.radicado,
        mode: 'insensitive',
      };
    }
    if (filters.subject) {
      requestWhere.subject = { contains: filters.subject, mode: 'insensitive' };
    }
    if (filters.status) {
      requestWhere.status = filters.status;
    }
    // Si no se especifican fechas, usar el mes actual
    if (!filters.startDate && !filters.endDate) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );

      requestWhere.createdAt = {
        gte: startOfMonth,
        lte: endOfMonth,
      };
    } else if (filters.startDate || filters.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (filters.startDate) {
        dateFilter.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        dateFilter.lte = new Date(filters.endDate + 'T23:59:59.999Z');
      }
      requestWhere.createdAt = dateFilter;
    }

    // Construir filtros para RequestExternal
    const requestExternalWhere: Record<string, any> = {
      entityId: user.entityId, // Filtrar por entidad del usuario
    };
    if (filters.radicado) {
      requestExternalWhere.radicado = {
        contains: filters.radicado,
        mode: 'insensitive',
      };
    }
    if (filters.subject) {
      requestExternalWhere.subject = {
        contains: filters.subject,
        mode: 'insensitive',
      };
    }
    if (filters.status) {
      requestExternalWhere.status = filters.status;
    }
    // Si no se especifican fechas, usar el mes actual
    if (!filters.startDate && !filters.endDate) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );

      requestExternalWhere.createdAt = {
        gte: startOfMonth,
        lte: endOfMonth,
      };
    } else if (filters.startDate || filters.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (filters.startDate) {
        dateFilter.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        dateFilter.lte = new Date(filters.endDate + 'T23:59:59.999Z');
      }
      requestExternalWhere.createdAt = dateFilter;
    }

    let internalRequests: Record<string, any>[] = [];
    let externalRequests: Record<string, any>[] = [];

    // Obtener requests internas
    if (!filters.type || filters.type === 'internal') {
      const internalData = await this.prisma.request.findMany({
        where: requestWhere,
        orderBy: { createdAt: 'desc' },
        include: {
          citizen: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          procedure: {
            select: {
              id: true,
              name: true,
            },
          },
          entity: {
            select: {
              id: true,
              name: true,
            },
          },
          currentArea: {
            select: {
              id: true,
              name: true,
            },
          },
          Document: true,
        },
      });

      internalRequests = internalData.map((req) => ({
        ...req,
        type: 'internal',
      }));
    }

    // Obtener requests externas
    if (!filters.type || filters.type === 'external') {
      const externalData = await this.prisma.requestExternal.findMany({
        where: requestExternalWhere,
        orderBy: { createdAt: 'desc' },
        include: {
          User: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          Document: true,
        },
      });

      externalRequests = externalData.map((req) => ({
        ...req,
        type: 'external',
      }));
    }

    // Combinar y ordenar resultados
    const allRequests = [
      ...internalRequests,
      ...externalRequests,
    ] as RequestWithRelations[];
    allRequests.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    // Generar Excel
    return this.generateExcelFile(allRequests);
  }

  private async generateExcelFile(
    requests: RequestWithRelations[],
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte de Solicitudes');

    // Configurar columnas
    worksheet.columns = [
      { header: 'Tipo', key: 'type', width: 12 },
      { header: 'Radicado', key: 'radicado', width: 20 },
      { header: 'Asunto', key: 'subject', width: 40 },
      { header: 'Estado', key: 'status', width: 15 },
      { header: 'Solicitante', key: 'citizenName', width: 30 },
      { header: 'Email Solicitante', key: 'citizenEmail', width: 30 },
      { header: 'Asignado a', key: 'assignedToName', width: 30 },
      { header: 'Email Asignado', key: 'assignedToEmail', width: 30 },
      { header: 'Procedimiento', key: 'procedureName', width: 25 },
      { header: 'Entidad', key: 'entityName', width: 25 },
      { header: 'Área Actual', key: 'currentAreaName', width: 20 },
      { header: 'Fecha Creación', key: 'createdAt', width: 20 },
      { header: 'Fecha Límite', key: 'deadline', width: 20 },
      { header: 'Documentos', key: 'documentsCount', width: 15 },
    ];

    // Estilo para el encabezado
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '366092' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // Agregar datos
    requests.forEach((request) => {
      const row = worksheet.addRow({
        type: request.type === 'internal' ? 'Interna' : 'Externa',
        radicado: request.radicado || 'Sin radicado',
        subject: request.subject,
        status: this.translateStatus(request.status),
        citizenName:
          request.type === 'internal'
            ? request.citizen?.fullName || 'N/A'
            : request.User?.fullName || 'N/A',
        citizenEmail:
          request.type === 'internal'
            ? request.citizen?.email || 'N/A'
            : request.User?.email || 'N/A',
        assignedToName:
          request.type === 'internal'
            ? request.assignedTo?.fullName || 'Sin asignar'
            : 'N/A',
        assignedToEmail:
          request.type === 'internal'
            ? request.assignedTo?.email || 'Sin asignar'
            : 'N/A',
        procedureName:
          request.type === 'internal'
            ? request.procedure?.name || 'N/A'
            : 'N/A',
        entityName:
          request.type === 'internal' ? request.entity?.name || 'N/A' : 'N/A',
        currentAreaName:
          request.type === 'internal'
            ? request.currentArea?.name || 'Sin área'
            : 'N/A',
        createdAt: this.formatDate(request.createdAt),
        deadline: this.formatDate(request.deadline),
        documentsCount: request.Document?.length || 0,
      });

      // Aplicar estilos alternados a las filas
      if (row.number % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F2F2F2' },
        };
      }

      // Colorear filas según el estado
      const statusCell = row.getCell('status');
      switch (request.status) {
        case 'PENDING':
          statusCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2CC' },
          };
          break;
        case 'IN_REVIEW':
          statusCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'D5E8D4' },
          };
          break;
        case 'COMPLETED':
          statusCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'D5E8D4' },
          };
          break;
        case 'OVERDUE':
          statusCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F8CECC' },
          };
          break;
      }
    });

    // Agregar filtros automáticos
    worksheet.autoFilter = {
      from: 'A1',
      to: `N${worksheet.rowCount}`,
    };

    // Generar buffer
    return (await workbook.xlsx.writeBuffer()) as Buffer;
  }

  private translateStatus(status: string): string {
    const statusMap: Record<string, string> = {
      PENDING: 'Pendiente',
      IN_REVIEW: 'En Revisión',
      COMPLETED: 'Completada',
      OVERDUE: 'Vencida',
    };
    return statusMap[status] || status;
  }

  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return 'N/A';
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
