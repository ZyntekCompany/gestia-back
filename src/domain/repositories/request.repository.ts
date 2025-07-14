// request.repository.ts
import { AssignAreaDto } from 'src/interfaces/dtos/request.dto';
import { RequestEntity } from '../entities/request.entity';

export interface RequestRepository {
  assignArea(
    requestId: string,
    officerId: string,
    dto: AssignAreaDto,
  ): Promise<void>;

  findById(id: string): Promise<RequestEntity>;
  completeRequest(requestId: string, userId: string): Promise<void>;
  findHistory(id: string, readerUserId?: string): Promise<any[]>;
}
