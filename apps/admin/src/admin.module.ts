import { CommonModule } from '@app/common';
import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [CommonModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
