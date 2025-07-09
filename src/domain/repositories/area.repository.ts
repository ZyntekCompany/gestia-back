import { Area } from '../entities/area';

export interface AreaRepository {
  createArea(area: Area): Promise<Area>;
  findById(id: string): Promise<Area | null>;
  updateArea(id: string, data: Partial<Area>): Promise<Area>;
  deleteArea(id: string): Promise<void>;
  findAllByEntity(
    entityId: string,
    page: number,
    limit: number,
    name?: string,
  ): Promise<{ data: Area[]; total: number }>;
}
