import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class SearchService {
  constructor(
    @Inject('JOBS_SERVICE') private readonly rabbitMqJobClient: ClientProxy,
  ) {}

  public handleSearch = async (type: string, query: string) => {
    if (type === 'jobs') {
      return await lastValueFrom(
        this.rabbitMqJobClient.send({ cmd: 'search-jobs-by-title' }, query),
      );
    }

    return [];
  };
}
