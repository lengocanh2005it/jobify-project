import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { ApplicationsService } from 'apps/api-gateway/src/applications/applications.service';
import { Request } from 'express';
import { Role } from 'libs/common/constants';
import { ResponseMessage, Roles } from 'libs/common/decorators';
import { CreateApplicationDto } from 'libs/common/dtos/create-application.dto';
import { ProcessApplicationsDto } from 'libs/common/dtos/process-applications.dto';
import { JwtAuthGuard, RoleAuthGuard } from 'libs/common/guards';
import { CreateApplication, UpdateApplication } from 'libs/common/utils/types';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.CANDIDATE)
  @ResponseMessage('New application created successfully!')
  @UseInterceptors(AnyFilesInterceptor())
  createApplication(
    @Body() createApplicationDto: CreateApplicationDto,
    @Req() request: Request,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    const resumeFile = files.find((file) => file.fieldname === 'resume');

    const coverLetterFile = files.find(
      (file) => file.fieldname === 'cover_letter',
    );

    const userId = request.user?.id as string;

    const createApplication: CreateApplication = {
      userId,
      resumeFile,
      coverLetterFile,
      jobId: createApplicationDto.job_id,
    };

    return this.applicationsService.createApplication(createApplication);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  getApplications() {
    return this.applicationsService.getApplications();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.RECRUITER, Role.ADMIN, Role.CANDIDATE)
  getApplication(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ) {
    const role = request.user?.role.name as string;

    return this.applicationsService.getApplication(id, role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.RECRUITER, Role.CANDIDATE)
  deleteApplication(@Param('id', ParseUUIDPipe) id: string) {
    return this.applicationsService.deleteApplication(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @ResponseMessage('Application updated successfully!')
  @UseInterceptors(AnyFilesInterceptor())
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  updateApplication(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    const resumeFile = files.find(
      (file) => file.fieldname === 'resume',
    ) as Express.Multer.File;

    const coverLetterFile = files.find(
      (file) => file.fieldname === 'cover_letter',
    );

    const updateApplication: UpdateApplication = {
      applicationId: id,
      resumeFile,
      coverLetterFile,
    };

    return this.applicationsService.updateApplication(updateApplication);
  }

  @Patch('/recruiters/process')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @ResponseMessage('Processed applications successfully!')
  @Roles(Role.RECRUITER, Role.ADMIN)
  processApplications(@Body() processApplicationsDto: ProcessApplicationsDto) {
    return this.applicationsService.handleProcessApplications(
      processApplicationsDto,
    );
  }

  @Get('candidates/me')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.CANDIDATE)
  getApplicationsOfCandidate(@Req() request: Request) {
    const userId = request.user?.id as string;

    return this.applicationsService.handleGetApplicationsOfCandidate(userId);
  }
}
