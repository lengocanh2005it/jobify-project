import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cloudinary from 'cloudinary';
import * as fs from 'fs';
import { UrlResponseType } from 'libs/common/utils/types';
import * as path from 'path';

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
      if (!file || !file.buffer) {
        throw new Error('Invalid file data.');
      }

      const tempFilePath = path.join(
        process.cwd(),
        'libs/common',
        'uploads',
        file.originalname,
      );

      await fs.promises.writeFile(tempFilePath, Buffer.from(file.buffer));

      const result = await cloudinary.v2.uploader.upload(tempFilePath, {
        resource_type: 'auto',
        type: 'upload',
        timeout: 60000,
        access_mode: 'public',
        invalidate: true,
        use_filename: true,
        unique_filename: false,
      });

      await fs.promises.unlink(tempFilePath);

      urlsArray.push({
        fieldname: file.fieldname,
        url: result.secure_url,
      });
    }

    return urlsArray;
  }
}
