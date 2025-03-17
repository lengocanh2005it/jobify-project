import { Module } from '@nestjs/common';
import { ApplicationsController } from 'apps/api-gateway/src/applications/applications.controller';
import { ApplicationsService } from 'apps/api-gateway/src/applications/applications.service';

@Module({
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
})
export class ApplicationsModule {}
