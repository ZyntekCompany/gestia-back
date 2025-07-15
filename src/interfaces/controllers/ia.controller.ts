import { Controller, Post, Body, Param } from '@nestjs/common';
import { IaUseCase } from '../../application/use-cases/ia/ia.use-case';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('')
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
