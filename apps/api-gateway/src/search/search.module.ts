import { CommonModule } from '@app/common';
import { Module } from '@nestjs/common';
import { SearchGateway } from 'apps/api-gateway/src/search/search.gateway';
import { SearchService } from 'apps/api-gateway/src/search/search.service';

@Module({
  imports: [CommonModule],
  controllers: [],
  providers: [SearchService, SearchGateway],
})
export class SearchModule {}
