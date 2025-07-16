import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ProcedureRepository } from 'src/domain/repositories/procedure.repository';
import { Procedure } from 'src/domain/entities/procedure';
import { JwtPayload } from 'src/types/express';
import { UserRepository } from 'src/domain/repositories/user.repository';

@Injectable()
export class ListProcedureByAreaUseCase {
  constructor(
    @Inject('UserRepository') private readonly userRepository: UserRepository,

    @Inject('ProcedureRepository')
    private readonly procedureRepo: ProcedureRepository,
  ) {}

  async execute(areaId: string): Promise<Procedure[]> {
    return this.procedureRepo.findByAreaId(areaId);
  }

  async executedEntityID(id: string, req: JwtPayload): Promise<Procedure[]> {
    const userId = req.sub;

    if (!userId) {
      throw new Error('User not found');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return this.procedureRepo.findByEntityId(id, user.id);
  }
}
