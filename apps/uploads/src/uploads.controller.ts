import { Controller, UseInterceptors } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ServicesExceptionInterceptor } from 'libs/common/interceptors';
import { UploadsService } from './uploads.service';

@Controller()
@UseInterceptors(ServicesExceptionInterceptor)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @MessagePattern({ cmd: 'upload-files' })
  async handleUploadsFile(@Payload() files: Array<Express.Multer.File>) {
    return this.uploadsService.handleUploadFile(files);
  }
}
