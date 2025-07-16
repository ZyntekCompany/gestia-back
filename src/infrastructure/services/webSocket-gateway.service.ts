import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class RequestsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage('join')
  async handleJoin(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
  ) {
    await client.join(room);
    console.log(`Cliente ${client.id} se unió a ${room}`);
  }

  emitNewRequest(entityId: string, request: any) {
    this.server.to(entityId).emit('newRequest', request);
  }

  emitRequestUpdate(requestId: string, payload: any) {
    this.server.to(requestId).emit('requestUpdate', payload);
  }
}
