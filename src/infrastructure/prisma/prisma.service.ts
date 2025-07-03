import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log: ['error', 'warn'],
    });
  }

  async onModuleInit() {
    await (this.$connect as () => Promise<void>).call(this);
  }

  async onModuleDestroy() {
    await (this.$disconnect as () => Promise<void>).call(this);
  }
}
