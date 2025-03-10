import { CommonModule } from '@app/common';
import { Module } from '@nestjs/common';
import { ServicesExceptionInterceptor } from 'libs/common/interceptors';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

@Module({
  imports: [CommonModule],
  controllers: [UploadsController],
  providers: [
    UploadsService,
    {
      provide: 'SERVICE_NAME',
      useValue: 'Uploads Service',
    },
    ServicesExceptionInterceptor,
  ],
})
export class UploadsModule {}
