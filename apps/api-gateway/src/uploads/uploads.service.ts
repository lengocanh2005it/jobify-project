import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class UploadsService {
  constructor(
    @Inject('UPLOADS_SERVICE')
    private readonly rabbitMqUploadsClient: ClientProxy,
  ) {}

  public handleUploadsFile = (files: Array<Express.Multer.File>) => {
    return this.rabbitMqUploadsClient.send({ cmd: 'upload-files' }, files);
  };
}
