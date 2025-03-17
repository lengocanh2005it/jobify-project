import { CommonModule } from '@app/common';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from 'apps/payments/src/entities';
import { ServicesExceptionInterceptor } from 'libs/common/interceptors';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [CommonModule, TypeOrmModule.forFeature([Transaction])],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    {
      provide: 'SERVICE_NAME',
      useValue: 'Payments Service',
    },
    ServicesExceptionInterceptor,
  ],
})
export class PaymentsModule {}
