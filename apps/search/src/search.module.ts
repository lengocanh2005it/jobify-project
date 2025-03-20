import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { CommonModule } from '@app/common';

@Module({
  imports: [CommonModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
