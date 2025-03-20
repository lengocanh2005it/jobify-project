import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { SearchService } from 'apps/api-gateway/src/search/search.service';
import { SearchDto } from 'libs/common/dtos';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true, namespace: '/search' })
export class SearchGateway {
  @WebSocketServer()
  private readonly server: Server;

  constructor(private readonly searchService: SearchService) {}

  @SubscribeMessage('search')
  async handleSearch(
    @MessageBody() searchDto: SearchDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { type, query } = searchDto;

    const response = await this.searchService.handleSearch(type, query);

    client.emit('searchResults', response);
  }
}
