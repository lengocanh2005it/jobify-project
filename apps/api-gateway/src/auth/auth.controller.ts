import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from 'apps/api-gateway/src/auth/auth.service';
import { ResponseMessage } from 'libs/common/decorators/response-message.decorator';
import { LoginDto } from 'libs/common/dtos/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ResponseMessage('LoggedIn successfully.')
  handleLogin(@Body() loginDto: LoginDto) {
    return this.authService.handleLogin(loginDto);
  }
}
