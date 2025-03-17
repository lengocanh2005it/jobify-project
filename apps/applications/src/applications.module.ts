import { CommonModule } from '@app/common';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application } from 'apps/applications/src/entities';
import { ServicesExceptionInterceptor } from 'libs/common/interceptors';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';

@Module({
  imports: [CommonModule, TypeOrmModule.forFeature([Application])],
  controllers: [ApplicationsController],
  providers: [
    ApplicationsService,
    {
      provide: 'SERVICE_NAME',
      useValue: 'Applications Service',
    },
    ServicesExceptionInterceptor,
  ],
})
export class ApplicationsModule {}
