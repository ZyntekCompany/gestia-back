import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class RequestsGateway {
  @WebSocketServer()
  server: Server;

  emitRequestUpdate(requestId: string, data: any) {
    this.server.to(requestId).emit('requestUpdated', data);
  }

  emitNewRequest(entityId: string, data: any) {
    this.server.to(`entity-${entityId}`).emit('newRequest', data);
  }
}
