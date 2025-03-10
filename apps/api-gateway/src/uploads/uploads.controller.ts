import {
  Controller,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadsService } from 'apps/api-gateway/src/uploads/uploads.service';
import { Role } from 'libs/common/constants';
import { Roles } from 'libs/common/decorators';
import { JwtAuthGuard, RoleAuthGuard } from 'libs/common/guards';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadsFile(@UploadedFiles() files: Array<Express.Multer.File>) {
    return this.uploadsService.handleUploadsFile(files);
  }
}
