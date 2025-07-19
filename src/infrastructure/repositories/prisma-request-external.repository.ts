import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { RequestExternalRepository } from 'src/domain/repositories/request-external.repository';
import { RequestExternalEntity } from 'src/domain/entities/request-external.entity';

@Injectable()
export class PrismaRequestExternalRepository extends RequestExternalRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(request: RequestExternalEntity): Promise<RequestExternalEntity> {
    const { content, ...rest } = request;
    const createdRequest = await this.prisma.requestExternal.create({
      data: {
        ...rest,
        content: content ?? {}, // Usa un objeto vacío si es null
      },
    });
    return new RequestExternalEntity(createdRequest);
  }

  async findAllWithPagination(params: {
    userId: string;
    page: number;
    limit: number;
    radicado?: string;
    subject?: string;
    status?: string;
  }): Promise<{ data: RequestExternalEntity[]; meta: any }> {
    const { userId, page, limit, radicado, subject, status } = params;
    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const where: Record<string, any> = { userId };
    if (typeof radicado === 'string' && radicado.length > 0) {
      where.radicado = { contains: radicado, mode: 'insensitive' };
    }
    if (typeof subject === 'string' && subject.length > 0) {
      where.subject = { contains: subject, mode: 'insensitive' };
    }
    if (typeof status === 'string' && status.length > 0) {
      where.status = status;
    }

    const [total, items] = await Promise.all([
      this.prisma.requestExternal.count({ where }),
      this.prisma.requestExternal.findMany({
        where,
        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    const totalPages = Math.ceil(total / limitNumber);
    return {
      data: items.map((req) => new RequestExternalEntity(req)),
      meta: {
        totalItems: total,
        totalPages,
        page: pageNumber,
        limit: limitNumber,
      },
    };
  }

  async findById(id: string): Promise<RequestExternalEntity | null> {
    const request = await this.prisma.requestExternal.findUnique({
      where: { id },
    });
    return request ? new RequestExternalEntity(request) : null;
  }

  async update(
    id: string,
    request: Partial<RequestExternalEntity>,
  ): Promise<RequestExternalEntity> {
    const { content, ...rest } = request;
    const updatedRequest = await this.prisma.requestExternal.update({
      where: { id },
      data: {
        ...rest,
        content: content ?? {}, // Usa un objeto vacío si es null
      },
    });
    return new RequestExternalEntity(updatedRequest);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.requestExternal.delete({ where: { id } });
  }
}
