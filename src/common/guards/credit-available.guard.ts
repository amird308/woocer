import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionPlan, SubscriptionStatus } from '../entities';

export const REQUIRE_CREDITS_KEY = 'requireCredits';

/**
 * Decorator to require available credits for route access
 * @param minCredits Minimum credits required (default: 1)
 */
export const RequireCredits = (minCredits: number = 1) =>
  Reflector.createDecorator<number>({
    key: REQUIRE_CREDITS_KEY,
    value: minCredits,
  });

@Injectable()
export class CreditAvailableGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredCredits = this.reflector.getAllAndOverride<number>(
      REQUIRE_CREDITS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredCredits || requiredCredits <= 0) {
      return true; // If no credits required, allow access
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
        'AI plan subscription required to use credits.',
      );
    }

    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new ForbiddenException(
        'Active subscription required to use credits.',
      );
    }

    // Calculate available credits
    const availableMonthlyCredits = Math.max(
      0,
      subscription.monthlyCredits - subscription.usedMonthlyCredits,
    );
    const availablePurchasedCredits = subscription.purchasedCredits;
    const totalAvailableCredits =
      availableMonthlyCredits + availablePurchasedCredits;

    if (totalAvailableCredits < requiredCredits) {
      throw new BadRequestException(
        `Insufficient credits. Required: ${requiredCredits}, Available: ${totalAvailableCredits}. Please purchase more credits.`,
      );
    }

    // Add subscription and credit info to request for use in controllers/services
    request.subscription = subscription;
    request.availableCredits = {
      total: totalAvailableCredits,
      monthly: availableMonthlyCredits,
      purchased: availablePurchasedCredits,
    };

    return true;
  }
}
