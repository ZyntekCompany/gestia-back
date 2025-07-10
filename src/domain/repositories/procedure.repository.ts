// src/domain/repositories/procedure.repository.ts

import { Procedure } from '../entities/procedure';

export interface ProcedureRepository {
  createProcedure(procedure: Procedure): Promise<Procedure>;
  findById(id: string): Promise<Procedure | null>;
  updateProcedure(id: string, data: Partial<Procedure>): Promise<Procedure>;
  deleteProcedure(id: string): Promise<void>;
  findByAreaId(areaId: string): Promise<Procedure[]>;
  // Agrega otros métodos si necesitas (listar, actualizar, eliminar, etc.)
}
