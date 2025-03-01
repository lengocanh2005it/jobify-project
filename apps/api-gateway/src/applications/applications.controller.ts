import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { ApplicationsService } from 'apps/api-gateway/src/applications/applications.service';
import { User } from 'apps/users/src/entities/users.entity';
import { Request } from 'express';
import { Role } from 'libs/common/constants';
import { ResponseMessage, Roles } from 'libs/common/decorators';
import { CreateApplicationDto } from 'libs/common/dtos/create-application.dto';
import { ProcessApplicationsDto } from 'libs/common/dtos/process-applications.dto';
import { SearchApplicationsDto } from 'libs/common/dtos/search-applications.dto';
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
  @ResponseMessage('Applications fetched successfully!')
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  getApplications(
    @Req() request: Request,
    @Query() searchApplicationsDto: SearchApplicationsDto,
  ) {
    const user = request.user as User;

    return this.applicationsService.getApplications(
      user,
      searchApplicationsDto,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @ResponseMessage('Application fetched successfully!')
  @Roles(Role.RECRUITER, Role.ADMIN, Role.CANDIDATE)
  getApplication(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ) {
    const user = request.user as User;

    return this.applicationsService.getApplication(id, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @ResponseMessage('Application deleted successfully!')
  @Roles(Role.ADMIN, Role.RECRUITER, Role.CANDIDATE)
  deleteApplication(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ) {
    const user = request.user as User;

    return this.applicationsService.deleteApplication(id, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @ResponseMessage('Application updated successfully!')
  @UseInterceptors(AnyFilesInterceptor())
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  updateApplication(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Req() request: Request,
  ) {
    const user = request.user as User;

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

    return this.applicationsService.updateApplication(updateApplication, user);
  }

  @Patch('recruiters/process')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @ResponseMessage('Processed applications successfully!')
  @Roles(Role.RECRUITER, Role.ADMIN)
  processApplications(
    @Body() processApplicationsDto: ProcessApplicationsDto,
    @Req() request: Request,
  ) {
    const user = request.user as User;

    return this.applicationsService.handleProcessApplications(
      processApplicationsDto,
      user,
    );
  }
}
