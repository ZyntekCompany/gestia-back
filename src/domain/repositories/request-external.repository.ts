import { RequestExternalEntity } from '../entities/request-external.entity';

export abstract class RequestExternalRepository {
  abstract create(
    request: RequestExternalEntity,
  ): Promise<RequestExternalEntity>;
  abstract findById(id: string): Promise<RequestExternalEntity | null>;
  abstract update(
    id: string,
    request: Partial<RequestExternalEntity>,
  ): Promise<RequestExternalEntity>;
  abstract delete(id: string): Promise<void>;
  abstract findAllWithPagination(params: {
    userId: string;
    page: number;
    limit: number;
    radicado?: string;
    subject?: string;
  }): Promise<{ data: RequestExternalEntity[]; meta: any }>;
}
