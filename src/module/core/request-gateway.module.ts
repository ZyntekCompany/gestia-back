import { Module } from '@nestjs/common';
import { RequestsGateway } from 'src/infrastructure/services/webSocket-gateway.service';

@Module({
  providers: [RequestsGateway],
  exports: [RequestsGateway],
})
export class GatewaysModule {}
