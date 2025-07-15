
import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { IaUseCase } from '../../application/use-cases/ia/ia.use-case';

@Controller('ia')
export class IaController {
  constructor(private readonly iaUseCase: IaUseCase) {}

  @Post(':id')
  async generateResponse(
    @Param('id') id: string,
    @Body('prompt') prompt: string,
  ): Promise<any> {
    return this.iaUseCase.generateResponse(id, prompt);
  }
}
