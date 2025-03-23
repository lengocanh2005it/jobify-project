import {
  Controller,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UploadsService } from 'apps/api-gateway/src/uploads/uploads.service';
import { API_TAGS, Role } from 'libs/common/constants';
import { ResponseMessage, Roles } from 'libs/common/decorators';
import { JwtAuthGuard, RoleAuthGuard } from 'libs/common/guards';

@Controller('uploads')
@UseGuards(JwtAuthGuard, RoleAuthGuard)
@Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
@ApiBearerAuth()
@ApiTags(API_TAGS.UPLOADS)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @ResponseMessage('Files uploaded successfully!')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiOperation({
    summary: 'Upload files',
    description: 'Upload files into systems.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload files into the system with additional data.',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Files uploaded successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid file format or size.' })
  async uploadsFile(@UploadedFiles() files: Array<Express.Multer.File>) {
    return this.uploadsService.handleUploadsFile(files);
  }
}
