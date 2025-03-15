import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import * as cloudinary from 'cloudinary';
import {
  generateRpcExceptionResponse,
  UrlResponseType,
} from 'libs/common/utils';

@Injectable()
export class UploadsService {
  constructor(private readonly configService: ConfigService) {
    cloudinary.v2.config({
      cloud_name: configService.get<string>('cloudinary.cloud_name'),
      api_key: configService.get<string>('cloudinary.api_key'),
      api_secret: configService.get<string>('cloudinary.api_secret'),
    });
  }

  public async handleUploadFile(
    files: Array<Express.Multer.File>,
  ): Promise<UrlResponseType[]> {
    const urlsArray: UrlResponseType[] = [];

    for (const file of files) {
      if (!file || !file.path)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.BAD_REQUEST,
            'Invalid file data.',
          ),
        );

      try {
        const result = await cloudinary.v2.uploader.upload(file.path, {
          resource_type: 'auto',
          type: 'upload',
          timeout: 60000,
          access_mode: 'public',
          invalidate: true,
          use_filename: true,
          unique_filename: false,
        });

        urlsArray.push({
          fieldname: file.fieldname,
          url: result.secure_url,
        });
      } catch (err) {
        console.error('❌ Upload failed:', err);
      }
    }

    return urlsArray;
  }
}
