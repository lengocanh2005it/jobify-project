import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class UploadsService {
  constructor(
    @Inject('UPLOADS_SERVICE')
    private readonly rabbitMqUploadsClient: ClientProxy,
  ) {}

  public handleUploadsFile = async (files: Array<Express.Multer.File>) => {
    return await lastValueFrom(
      this.rabbitMqUploadsClient.send({ cmd: 'upload-files' }, files),
    );
  };
}
