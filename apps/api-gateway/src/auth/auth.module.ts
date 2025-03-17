import { Module } from '@nestjs/common';
import { AuthController } from 'apps/api-gateway/src/auth/auth.controller';
import { AuthService } from 'apps/api-gateway/src/auth/auth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
