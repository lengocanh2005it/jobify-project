import { Module } from '@nestjs/common';
import { AdminController } from 'apps/api-gateway/src/admin/admin.controller';
import { AdminService } from 'apps/api-gateway/src/admin/admin.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
