import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from 'libs/common/decorators/roles.decorator';
import { Observable } from 'rxjs';

@Injectable()
export class RoleAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getClass(), context.getHandler()],
    );

    if (!requiredRoles || !requiredRoles.length) return true;

    const request = context.switchToHttp().getRequest<Request>();

    const role = (request.user as Record<string, string | number>)
      .role as string;

    if (!role) throw new UnauthorizedException('User Not Authenticated.');

    const isHasRole = requiredRoles.includes(role);

    if (!isHasRole)
      throw new ForbiddenException(
        "You don't have permission to access this route.",
      );

    return true;
  }
}
