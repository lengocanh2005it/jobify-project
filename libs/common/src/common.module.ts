import { Global, Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { CustomValidationPipe } from 'libs/common/pipe/validation.pipe';

@Global()
@Module({
  providers: [CommonService, CustomValidationPipe],
  exports: [CommonService, CustomValidationPipe],
})
export class CommonModule {}
