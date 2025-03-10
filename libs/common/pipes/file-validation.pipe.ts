import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import * as path from 'path';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  transform(files: Array<Express.Multer.File>) {
    if (files) {
      files.forEach((file) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const mimeType = file.mimetype;

        if (file.fieldname === 'avatar') {
          if (
            !['image/png', 'image/jpeg', 'image/jpg'].includes(mimeType) ||
            !['.png', '.jpg', '.jpeg'].includes(ext)
          ) {
            throw new BadRequestException(
              `Invalid avatar file: ${file.originalname}`,
            );
          }
        }

        if (file.fieldname === 'cv') {
          if (
            ![
              'application/pdf',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ].includes(mimeType) ||
            !['.pdf', '.doc', '.docx'].includes(ext)
          ) {
            throw new BadRequestException(
              `Invalid CV file: ${file.originalname}`,
            );
          }
        }
      });

      return files;
    }
  }
}
