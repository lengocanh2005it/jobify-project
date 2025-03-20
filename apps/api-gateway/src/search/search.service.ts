import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class SearchService {
  constructor(
    @Inject('SEARCH_SERVICE')
    private readonly rabbitMqSearchClient: ClientProxy,
  ) {}

  public handleSearch = async (type: string, query: string) => {
    return lastValueFrom(
      this.rabbitMqSearchClient.send(
        { cmd: 'search' },
        {
          type,
          query,
        },
      ),
    );
  };
}
