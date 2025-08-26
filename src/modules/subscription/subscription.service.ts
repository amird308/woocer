import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateSubscriptionRequestDto,
  UpdateSubscriptionRequestDto,
  ConsumeCreditsRequestDto,
} from './models/subscription.request';
import {
  SubscriptionResponseDto,
  SubscriptionWithCreditsResponseDto,
  CreditConsumptionResponseDto,
} from './models/subscription.response';
import {
  CreditTransactionType,
  SubscriptionPlan,
  SubscriptionStatus,
} from '@/common/entities';

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  async createSubscription(
    userId: string,
    data: CreateSubscriptionRequestDto,
  ): Promise<SubscriptionResponseDto> {
    // Check if subscription already exists for this user
    const existingActiveSubscription = await this.prisma.subscription.findFirst(
      {
        where: {
          userId,
          isActive: true,
        },
      },
    );

    if (existingActiveSubscription) {
      throw new BadRequestException('User already has an active subscription');
    }

    // Set default billing period
    const billingPeriod = data.billingPeriod || 1;

    // Calculate credits based on plan and billing period
    const totalCredits = this.calculateTotalCredits(data.plan, billingPeriod);

    // Set current period dates
    const now = new Date();
    const currentPeriodEnd =
      data.plan === SubscriptionPlan.TRIAL
        ? new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) // 14 days for trial
        : new Date(now.getTime() + billingPeriod * 30 * 24 * 60 * 60 * 1000); // months for paid plans

    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        revenueCatCustomerId: data.revenueCatCustomerId,
        plan: data.plan,
        status:
          data.plan === SubscriptionPlan.TRIAL
            ? SubscriptionStatus.TRIALING
            : SubscriptionStatus.ACTIVE,
        billingPeriod,
        currentPeriodStart: now,
        currentPeriodEnd,
        totalCredits,
        usedCredits: 0,
        purchasedCredits: 0,
        isActive: true,
      },
    });

    return subscription as SubscriptionResponseDto;
  }

  async updateSubscription(
    subscriptionId: string,
    data: UpdateSubscriptionRequestDto,
  ): Promise<SubscriptionResponseDto> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const updateData: any = { ...data };

    // Note: Period dates are managed automatically by the system

    const updated = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: updateData,
    });

    return updated as SubscriptionResponseDto;
  }

  async getSubscriptionByUser(
    userId: string,
  ): Promise<SubscriptionWithCreditsResponseDto | null> {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        isActive: true,
      },
      include: {
        employeeSubscriptionSponsorship: true,
      },
    });

    if (!subscription) {
      return null;
    }

    return this.calculateCreditSummary(subscription);
  }

  async getTrialSubscription(
    userId: string,
  ): Promise<SubscriptionWithCreditsResponseDto | null> {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        plan: SubscriptionPlan.TRIAL,
        isActive: true,
      },
      include: {
        employeeSubscriptionSponsorship: true,
      },
    });

    if (!subscription) {
      return null;
    }

    return this.calculateCreditSummary(subscription);
  }

  async createTrialSubscription(
    userId: string,
  ): Promise<SubscriptionResponseDto> {
    // Check if user already has any active subscription
    const existingSubscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        isActive: true,
      },
    });

    if (existingSubscription) {
      throw new BadRequestException('User already has an active subscription');
    }

    const now = new Date();
    const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days

    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        plan: SubscriptionPlan.TRIAL,
        status: SubscriptionStatus.TRIALING,
        billingPeriod: 14, // 14 days for trial
        currentPeriodStart: now,
        currentPeriodEnd: trialEnd,
        totalCredits: 50, // 50 trial credits
        usedCredits: 0,
        purchasedCredits: 0,
        isActive: true,
      },
    });

    return subscription as SubscriptionResponseDto;
  }

  async convertTrialToPaid(
    userId: string,
    data: CreateSubscriptionRequestDto,
  ): Promise<SubscriptionResponseDto> {
    // Find active trial
    const trialSubscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        plan: SubscriptionPlan.TRIAL,
        isActive: true,
      },
    });

    if (!trialSubscription) {
      throw new NotFoundException('No active trial subscription found');
    }

    // Deactivate trial
    await this.prisma.subscription.update({
      where: { id: trialSubscription.id },
      data: { isActive: false },
    });

    // Create new paid subscription
    return this.createSubscription(userId, data);
  }

  async getSubscriptionById(
    subscriptionId: string,
  ): Promise<SubscriptionWithCreditsResponseDto> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        employeeSubscriptionSponsorship: true,
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return this.calculateCreditSummary(subscription);
  }

  async consumeCredits(
    userId: string,
    data: ConsumeCreditsRequestDto,
  ): Promise<CreditConsumptionResponseDto> {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        isActive: true,
      },
      include: {
        employeeSubscriptionSponsorship: true,
      },
    });

    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    // Allow credit consumption for TRIAL and AI plans only
    if (subscription.plan === SubscriptionPlan.PRO) {
      throw new ForbiddenException(
        'PRO plan subscribers cannot use AI credits',
      );
    }

    if (
      subscription.status !== SubscriptionStatus.ACTIVE &&
      subscription.status !== SubscriptionStatus.TRIALING
    ) {
      throw new ForbiddenException('Subscription is not active');
    }

    const creditSummary = this.calculateCreditSummary(subscription);

    if (creditSummary.availableCredits < data.credits) {
      throw new BadRequestException('Insufficient credits');
    }

    // Use credits in priority order: total credits first, then purchased credits
    let creditsToConsume = data.credits;
    let totalCreditsUsed = 0;
    let purchasedCreditsUsed = 0;

    // First, use available total credits
    if (creditSummary.availableTotalCredits > 0) {
      totalCreditsUsed = Math.min(
        creditsToConsume,
        creditSummary.availableTotalCredits,
      );
      creditsToConsume -= totalCreditsUsed;
    }

    // Then, use purchased credits if needed
    if (creditsToConsume > 0) {
      purchasedCreditsUsed = creditsToConsume;
    }

    // Get organization ID from sponsorship or user's membership
    const finalOrganizationId =
      subscription.employeeSubscriptionSponsorship?.organizationId ||
      // Get user's first organization membership as fallback
      (
        await this.prisma.member.findFirst({
          where: { userId },
          select: { organizationId: true },
        })
      )?.organizationId;

    if (!finalOrganizationId) {
      throw new BadRequestException(
        'User must be part of an organization to use credits',
      );
    }

    // Update subscription in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Update subscription counters
      const updatedSubscription = await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          usedCredits: subscription.usedCredits + totalCreditsUsed,
          purchasedCredits:
            subscription.purchasedCredits - purchasedCreditsUsed,
        },
      });

      // Create credit transaction record
      const transaction = await tx.creditTransaction.create({
        data: {
          userId,
          organizationId: finalOrganizationId,
          subscriptionId: subscription.id,
          type: CreditTransactionType.CONSUMED,
          amount: -data.credits, // Negative for consumption
          description: data.description,
          metadata: data.metadata,
        },
      });

      return { updatedSubscription, transaction };
    });

    const remainingCredits = creditSummary.availableCredits - data.credits;

    return {
      creditsConsumed: data.credits,
      totalCreditsUsed,
      purchasedCreditsUsed,
      remainingCredits,
      transactionId: result.transaction.id,
    };
  }

  async resetPeriodCredits(
    subscriptionId: string,
  ): Promise<SubscriptionResponseDto> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        employeeSubscriptionSponsorship: true,
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Only monthly subscriptions get credit resets
    if (subscription.billingPeriod !== 1) {
      throw new BadRequestException(
        'Only monthly subscriptions can reset credits',
      );
    }

    const newCredits = this.calculateTotalCredits(
      subscription.plan as SubscriptionPlan,
      subscription.billingPeriod,
    );

    const updatedSubscription = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        usedCredits: 0,
        totalCredits: newCredits,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    });

    // Note: Credit transactions are optional for period resets
    // They can be added later if needed for audit trails

    return updatedSubscription as SubscriptionResponseDto;
  }

  async addPurchasedCredits(
    subscriptionId: string,
    credits: number,
  ): Promise<SubscriptionResponseDto> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        employeeSubscriptionSponsorship: true,
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Update subscription with purchased credits
    const updatedSubscription = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        purchasedCredits: subscription.purchasedCredits + credits,
      },
    });

    // Note: Credit transaction logging can be added here if needed

    return updatedSubscription as SubscriptionResponseDto;
  }

  private calculateTotalCredits(
    plan: SubscriptionPlan,
    billingPeriod: number,
  ): number {
    switch (plan) {
      case SubscriptionPlan.TRIAL:
        return 50; // 50 credits for 14-day trial
      case SubscriptionPlan.PRO:
        return 0; // No AI credits for PRO plan
      case SubscriptionPlan.AI:
        if (billingPeriod === 1) {
          return 100; // 100 credits per month
        } else if (billingPeriod === 6) {
          return 600; // 100 * 6 months upfront
        } else if (billingPeriod === 12) {
          return 1200; // 100 * 12 months upfront
        }
        return 0;
      default:
        return 0;
    }
  }

  private calculateCreditSummary(
    subscription: any,
  ): SubscriptionWithCreditsResponseDto {
    const availableTotalCredits = Math.max(
      0,
      subscription.totalCredits - subscription.usedCredits,
    );
    const availablePurchasedCredits = subscription.purchasedCredits;
    const availableCredits = availableTotalCredits + availablePurchasedCredits;

    const canUseAIFeatures =
      (subscription.plan === SubscriptionPlan.AI ||
        subscription.plan === SubscriptionPlan.TRIAL) &&
      (subscription.status === SubscriptionStatus.ACTIVE ||
        subscription.status === SubscriptionStatus.TRIALING);

    const isSponsored = !!subscription.employeeSubscriptionSponsorship;
    const sponsorshipInfo = subscription.employeeSubscriptionSponsorship
      ? {
          id: subscription.employeeSubscriptionSponsorship.id,
          sponsorUserId:
            subscription.employeeSubscriptionSponsorship.sponsorUserId,
          sponsorUserName: '', // Would need to include sponsor user in query
          organizationId:
            subscription.employeeSubscriptionSponsorship.organizationId,
          organizationName: '', // Would need to include organization in query
          monthlyCost: Number(
            subscription.employeeSubscriptionSponsorship.monthlyCost,
          ),
          sponsoredAt: subscription.employeeSubscriptionSponsorship.sponsoredAt,
        }
      : undefined;

    return {
      ...subscription,
      availableCredits,
      availableTotalCredits,
      availablePurchasedCredits,
      canUseAIFeatures,
      isSponsored,
      sponsorshipInfo,
    };
  }
}
