import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionPlan, SubscriptionStatus } from '../entities';

export const REQUIRE_AI_PLAN_KEY = 'requireAIPlan';

/**
 * Decorator to require AI plan subscription for route access
 */
export const RequireAIPlan = () =>
  Reflector.createDecorator<boolean>({ key: REQUIRE_AI_PLAN_KEY, value: true });

@Injectable()
export class AIPlanGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requireAIPlan = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_AI_PLAN_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requireAIPlan) {
      return true; // If the route doesn't require AI plan, allow access
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const organizationId = request.organizationId || user?.organizationId;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!organizationId) {
      throw new ForbiddenException('Organization context required');
    }

    // Get user's subscription for the current organization
    const subscription = await this.prisma.subscription.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId,
        },
      },
    });

    if (!subscription) {
      throw new ForbiddenException(
        'No subscription found. Please subscribe to access AI features.',
      );
    }

    if (subscription.plan !== SubscriptionPlan.AI) {
      throw new ForbiddenException(
        'AI plan subscription required to access this feature.',
      );
    }

    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new ForbiddenException(
        'Active subscription required to access AI features.',
      );
    }

    if (!subscription.isActive) {
      throw new ForbiddenException('Subscription is not active.');
    }

    // Add subscription info to request for use in controllers/services
    request.subscription = subscription;

    return true;
  }
}

