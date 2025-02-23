import { Controller, Get } from '@nestjs/common';
import { ApplicationsService } from './applications.service';

@Controller()
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  getHello(): string {
    return this.applicationsService.getHello();
  }
}
