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
  ): Promise<{ data: RequestExternalEntity[]; meta: any }> {
    const userId = (req.user as JwtPayload | undefined)?.sub;
    if (!userId) throw new BadRequestException('Usuario no autenticado');

    // Leer filtros y paginación de los query params
    const { page = 1, limit = 10, radicado, subject } = req.query;
    const pageNumber = Number(page) > 0 ? Number(page) : 1;
    const pageSize = Number(limit) > 0 ? Number(limit) : 10;

    // Pasar los filtros y paginación al repositorio
    const result = await this.requestExternalRepository.findAllWithPagination({
      userId,
      page: pageNumber,
      limit: pageSize,
      radicado: radicado as string | undefined,
      subject: subject as string | undefined,
    });
    return result;
  }
}
