import { Controller } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateCompanyDto } from 'libs/common/dtos/create-company.dto';

@Controller()
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @MessagePattern({ cmd: 'create-company' })
  async handleCreateCompany(
    @Payload('createCompanyDto') createCompanyDto: CreateCompanyDto,
    @Payload('userId') userId: string,
  ) {
    return await this.jobsService.handleCreateCompany(userId, createCompanyDto);
  }
}
