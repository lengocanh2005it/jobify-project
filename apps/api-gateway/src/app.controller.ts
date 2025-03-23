import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { API_TAGS } from 'libs/common/constants';

@Controller()
@ApiTags(API_TAGS.APP)
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'App Controller',
    description: 'App root controller for the application.',
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
