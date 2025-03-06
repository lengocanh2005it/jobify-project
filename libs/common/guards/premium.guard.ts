import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';

@Injectable()
export class PremiumGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const { user } = request;

    if (!user) throw new UnauthorizedException(`User not authenticated`);

    const isPremium = user.is_premium as boolean;

    if (!isPremium)
      throw new ForbiddenException(
        'Please upgrade your account to premium to access this route.',
      );

    return isPremium;
  }
}
