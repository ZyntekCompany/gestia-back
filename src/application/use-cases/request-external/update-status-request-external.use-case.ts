import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@Injectable()
export class UpdateStatusRequestExternalUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(id: string) {
    const request = await this.prisma.requestExternal.findUnique({
      where: { id },
    });
    if (!request)
      throw new NotFoundException('Solicitud externa no encontrada');
    const updated = await this.prisma.requestExternal.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });
    return updated;
  }
}
