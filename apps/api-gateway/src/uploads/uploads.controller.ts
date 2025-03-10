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
import { ResponseMessage, Roles } from 'libs/common/decorators';
import { JwtAuthGuard, RoleAuthGuard } from 'libs/common/guards';

@Controller('uploads')
@UseGuards(JwtAuthGuard, RoleAuthGuard)
@Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @ResponseMessage('Files uploaded successfully!')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadsFile(@UploadedFiles() files: Array<Express.Multer.File>) {
    return this.uploadsService.handleUploadsFile(files);
  }
}
