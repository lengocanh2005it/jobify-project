import { Controller } from '@nestjs/common';
import { SearchService } from './search.service';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @MessagePattern({ cmd: 'search' })
  async handleSearch(
    @Payload('type') type: string,
    @Payload('query') query: string,
  ) {
    return this.searchService.handleSearch(type, query);
  }
}
