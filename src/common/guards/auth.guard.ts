import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../better-auth/auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const session = await this.authService.getSession(request);

    if (!session) {
      throw new UnauthorizedException('Not authenticated');
    }

    // Attach the session to the request for later use
    (request as any).user = session.user;
    (request as any).session = session;

    return true;
  }
}
