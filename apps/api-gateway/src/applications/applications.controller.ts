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
  UseGuards,
} from '@nestjs/common';
import { ApplicationsService } from 'apps/api-gateway/src/applications/applications.service';
import { Request } from 'express';
import { Role } from 'libs/common/constants';
import { Roles } from 'libs/common/decorators';
import { ApproveApplicationsDto } from 'libs/common/dtos/approve-applications.dto';
import { CreateApplicationDto } from 'libs/common/dtos/create-application.dto';
import { RejectApplicationsDto } from 'libs/common/dtos/reject-applications.dto';
import { UpdateApplicationDto } from 'libs/common/dtos/update-application.dto';
import { JwtAuthGuard, RoleAuthGuard } from 'libs/common/guards';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.CANDIDATE)
  createApplication(
    @Body() createApplicationDto: CreateApplicationDto,
    @Req() request: Request,
  ) {
    const userId = request.user?.id as string;

    return this.applicationsService.createApplication(
      createApplicationDto,
      userId,
    );
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
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  updateApplication(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateApplicationDto: UpdateApplicationDto,
  ) {
    return this.applicationsService.updateApplication(id, updateApplicationDto);
  }

  @Patch('approve')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.RECRUITER, Role.ADMIN)
  approveApplications(@Body() approveApplicationsDto: ApproveApplicationsDto) {
    return this.applicationsService.handleApproveApplications(
      approveApplicationsDto,
    );
  }

  @Patch('reject')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.RECRUITER, Role.ADMIN)
  rejectApplications(@Body() rejectedApplicationsDto: RejectApplicationsDto) {
    return this.applicationsService.handleRejectApplications(
      rejectedApplicationsDto,
    );
  }
}
