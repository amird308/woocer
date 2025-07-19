import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AuthService } from '../better-auth/auth.service';

// Decorator metadata key
export const PERMISSIONS_KEY = 'permissions';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<
      Record<string, string[]>
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermissions) {
      return true; // No permissions required
    }

    const request = context.switchToHttp().getRequest<Request>();

    try {
      const hasPermission = await this.authService.hasPermission(
        request,
        requiredPermissions,
      );

      if (!hasPermission) {
        throw new ForbiddenException('Insufficient permissions');
      }

      return true;
    } catch (error: unknown) {
      console.error(error);
      throw new ForbiddenException('Permission check failed');
    }
  }
}
