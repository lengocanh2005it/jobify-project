import { Module } from '@nestjs/common';
import { UploadsController } from 'apps/api-gateway/src/uploads/uploads.controller';
import { UploadsService } from 'apps/api-gateway/src/uploads/uploads.service';

@Module({
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}
