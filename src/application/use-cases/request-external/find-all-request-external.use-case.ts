import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { RequestExternalRepository } from 'src/domain/repositories/request-external.repository';
import { RequestExternalEntity } from 'src/domain/entities/request-external.entity';
import { Request } from 'express';
import { JwtPayload } from 'src/types/express';

@Injectable()
export class FindAllRequestExternalUseCase {
  constructor(
    @Inject('RequestExternalRepository')
    private readonly requestExternalRepository: RequestExternalRepository,
  ) {}

  async execute(
    req: Request,
    query: {
      page?: number;
      limit?: number;
      subject?: string;
      radicado?: string;
      status?: string;
    },
  ): Promise<{ data: RequestExternalEntity[]; meta: any }> {
    const userId = (req.user as JwtPayload | undefined)?.sub;
    if (!userId) throw new BadRequestException('Usuario no autenticado');

    // Leer filtros y paginación de los query params
    const pageNumber = query.page! > 0 ? query.page : 1;
    const pageSize = query.limit! > 0 ? query.limit : 10;

    // Pasar los filtros y paginación al repositorio
    const result = await this.requestExternalRepository.findAllWithPagination({
      userId,
      page: pageNumber!,
      limit: pageSize!,
      radicado: query.radicado,
      subject: query.subject,
      status: query.status,
    });
    return result;
  }
}
