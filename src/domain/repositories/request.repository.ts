// request.repository.ts
import {
  AssignAreaDto,
  CreateRequestDto,
  RespondRequestDto,
} from 'src/interfaces/dtos/request.dto';
import { RequestEntity } from '../entities/request.entity';

export interface RequestRepository {
  createRequest(
    data: CreateRequestDto,
    citizenId: string,
  ): Promise<RequestEntity>;
  assignArea(
    requestId: string,
    officerId: string,
    dto: AssignAreaDto,
  ): Promise<void>;
  respondToRequest(
    requestId: string,
    userId: string,
    role: string,
    dto: RespondRequestDto,
  ): Promise<void>;
  findById(id: string): Promise<RequestEntity>;
  findHistory(id: string, readerUserId?: string): Promise<any[]>;
}
