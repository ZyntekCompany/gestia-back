import { RequestStatus, Prisma } from '@prisma/client';

export class RequestExternalEntity {
  id: string;
  radicado: string | null;
  typeRequest: string;
  recipient: string;
  userId: string | null;
  mailrecipient: string;
  maxResponseDays: number;
  subject: string;
  content: Prisma.JsonValue;
  status: RequestStatus;
  entityId: string;
  deadline: Date;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<RequestExternalEntity>) {
    Object.assign(this, partial);
  }
}
