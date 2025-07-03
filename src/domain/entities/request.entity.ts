import { RequestStatus, Prisma } from '@prisma/client';

export class RequestEntity {
  id: string;
  subject: string;
  content: Prisma.JsonValue | undefined;
  status: RequestStatus;
  procedureId: string;
  citizenId: string;
  assignedToId: string;
  entityId: string;
  currentAreaId: string;
  deadline: Date;
  createdAt: Date;
  updatedAt: Date;
  // ...agrega lo que necesites (ejemplo, procedure o area completo para retornos)
  constructor(partial: Partial<RequestEntity>) {
    Object.assign(this, partial);
  }
}
