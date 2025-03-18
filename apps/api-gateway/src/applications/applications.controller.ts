import {
  Cache,
  CACHE_MANAGER,
  CacheInterceptor,
  CacheKey,
  CacheTTL,
} from '@nestjs/cache-manager';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Inject,
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
import { RpcException } from '@nestjs/microservices';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { ApplicationsService } from 'apps/api-gateway/src/applications/applications.service';
import { User } from 'apps/users/src/entities';
import { Request } from 'express';
import { Role } from 'libs/common/constants';
import { ResponseMessage, Roles } from 'libs/common/decorators';
import {
  CreateApplicationDto,
  ProcessApplicationsDto,
  SearchApplicationsDto,
} from 'libs/common/dtos';
import { JwtAuthGuard, RoleAuthGuard } from 'libs/common/guards';
import {
  CreateApplication,
  generateRpcExceptionResponse,
  UpdateApplication,
} from 'libs/common/utils';

@Controller('applications')
@UseGuards(JwtAuthGuard, RoleAuthGuard)
export class ApplicationsController {
  constructor(
    private readonly applicationsService: ApplicationsService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @Post()
  @Roles(Role.CANDIDATE)
  @ResponseMessage('New application created successfully!')
  @UseInterceptors(AnyFilesInterceptor())
  async createApplication(
    @Body() createApplicationDto: CreateApplicationDto,
    @Req() request: Request,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    const resumeFile = files.find((file) => file.fieldname === 'resume');

    if (!resumeFile)
      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.BAD_GATEWAY,
          `You must provide Resume (CV) File.`,
        ),
      );

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
  @ResponseMessage('Applications fetched successfully!')
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  @UseInterceptors(CacheInterceptor)
  async getApplications(
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
  @ResponseMessage('Application fetched successfully!')
  @Roles(Role.RECRUITER, Role.ADMIN, Role.CANDIDATE)
  async getApplication(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ) {
    const user = request.user as User;

    const cacheKey = `applications:${id}`;

    const cachedApplication = await this.cacheManager.get(cacheKey);

    if (cachedApplication) return cachedApplication;

    const application = await this.applicationsService.getApplication(id, user);

    await this.cacheManager.set(cacheKey, application);

    return application;
  }

  @Delete(':id')
  @ResponseMessage('Application deleted successfully!')
  @Roles(Role.ADMIN, Role.RECRUITER, Role.CANDIDATE)
  async deleteApplication(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ) {
    const user = request.user as User;

    return this.applicationsService.deleteApplication(id, user);
  }

  @Patch(':id')
  @ResponseMessage('Application updated successfully!')
  @UseInterceptors(AnyFilesInterceptor())
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  async updateApplication(
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
  @ResponseMessage('Processed applications successfully!')
  @Roles(Role.RECRUITER, Role.ADMIN)
  async processApplications(
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
