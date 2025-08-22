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
  SubscriptionPlan,
  SubscriptionStatus,
  CreditTransactionType,
} from '../../common/entities';

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  async createSubscription(
    userId: string,
    organizationId: string,
    data: CreateSubscriptionRequestDto,
  ): Promise<SubscriptionResponseDto> {
    // Check if subscription already exists for this user-organization pair
    const existingSubscription = await this.prisma.subscription.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    if (existingSubscription) {
      throw new BadRequestException(
        'Subscription already exists for this user and organization',
      );
    }

    const subscription = await this.prisma.subscription.create({
      data: {
        ...data,
        userId,
        organizationId,
        currentPeriodStart: new Date(data.currentPeriodStart),
        currentPeriodEnd: new Date(data.currentPeriodEnd),
        monthlyCredits: data.monthlyCredits || (data.plan === 'ai' ? 100 : 0), // Default 100 credits for AI plan
      },
    });

    // Create initial monthly allocation transaction if AI plan
    if (data.plan === 'ai' && subscription.monthlyCredits > 0) {
      await this.prisma.creditTransaction.create({
        data: {
          userId,
          organizationId,
          subscriptionId: subscription.id,
          type: 'MONTHLY_ALLOCATION',
          amount: subscription.monthlyCredits,
          description: `Monthly credit allocation for ${data.plan} plan`,
        },
      });
    }

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

    // Convert date strings to Date objects if provided
    if (data.currentPeriodStart) {
      updateData.currentPeriodStart = new Date(data.currentPeriodStart);
    }
    if (data.currentPeriodEnd) {
      updateData.currentPeriodEnd = new Date(data.currentPeriodEnd);
    }

    const updated = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: updateData,
    });

    return updated as SubscriptionResponseDto;
  }

  async getSubscriptionByUserAndOrganization(
    userId: string,
    organizationId: string,
  ): Promise<SubscriptionWithCreditsResponseDto | null> {
    const subscription = await this.prisma.subscription.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    if (!subscription) {
      return null;
    }

    return this.calculateCreditSummary(subscription);
  }

  async getSubscriptionById(
    subscriptionId: string,
  ): Promise<SubscriptionWithCreditsResponseDto> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return this.calculateCreditSummary(subscription);
  }

  async consumeCredits(
    userId: string,
    organizationId: string,
    data: ConsumeCreditsRequestDto,
  ): Promise<CreditConsumptionResponseDto> {
    const subscription = await this.prisma.subscription.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException('No subscription found');
    }

    if ((subscription.plan as string) !== 'ai') {
      throw new ForbiddenException('Only AI plan subscribers can use credits');
    }

    if ((subscription.status as string) !== 'active') {
      throw new ForbiddenException('Subscription is not active');
    }

    const creditSummary = this.calculateCreditSummary(subscription);

    if (creditSummary.availableCredits < data.credits) {
      throw new BadRequestException('Insufficient credits');
    }

    // Use credits in priority order: monthly credits first, then purchased credits
    let creditsToConsume = data.credits;
    let monthlyCreditsUsed = 0;
    let purchasedCreditsUsed = 0;

    // First, use available monthly credits
    if (creditSummary.availableMonthlyCredits > 0) {
      monthlyCreditsUsed = Math.min(
        creditsToConsume,
        creditSummary.availableMonthlyCredits,
      );
      creditsToConsume -= monthlyCreditsUsed;
    }

    // Then, use purchased credits if needed
    if (creditsToConsume > 0) {
      purchasedCreditsUsed = creditsToConsume;
    }

    // Update subscription in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Update subscription counters
      const updatedSubscription = await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          usedMonthlyCredits:
            subscription.usedMonthlyCredits + monthlyCreditsUsed,
          purchasedCredits:
            subscription.purchasedCredits - purchasedCreditsUsed,
        },
      });

      // Create credit transaction record
      const transaction = await tx.creditTransaction.create({
        data: {
          userId,
          organizationId,
          subscriptionId: subscription.id,
          type: 'CONSUMED',
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
      monthlyCreditsUsed,
      purchasedCreditsUsed,
      remainingCredits,
      transactionId: result.transaction.id,
    };
  }

  async resetMonthlyCredits(
    subscriptionId: string,
  ): Promise<SubscriptionResponseDto> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const updatedSubscription = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        usedMonthlyCredits: 0,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    });

    // Create monthly allocation transaction
    if (
      (subscription.plan as string) === 'ai' &&
      subscription.monthlyCredits > 0
    ) {
      await this.prisma.creditTransaction.create({
        data: {
          userId: subscription.userId,
          organizationId: subscription.organizationId,
          subscriptionId: subscription.id,
          type: 'MONTHLY_ALLOCATION',
          amount: subscription.monthlyCredits,
          description: `Monthly credit reset for ${subscription.plan} plan`,
        },
      });
    }

    return updatedSubscription as SubscriptionResponseDto;
  }

  async addPurchasedCredits(
    subscriptionId: string,
    credits: number,
    transactionId: string,
  ): Promise<SubscriptionResponseDto> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Update subscription with purchased credits
      const updatedSubscription = await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          purchasedCredits: subscription.purchasedCredits + credits,
        },
      });

      // Create credit transaction record
      await tx.creditTransaction.create({
        data: {
          userId: subscription.userId,
          organizationId: subscription.organizationId,
          subscriptionId: subscription.id,
          type: 'PURCHASED',
          amount: credits,
          description: `Purchased ${credits} credits`,
          metadata: { transactionId },
        },
      });

      return updatedSubscription;
    });

    return result as SubscriptionResponseDto;
  }

  private calculateCreditSummary(
    subscription: any,
  ): SubscriptionWithCreditsResponseDto {
    const availableMonthlyCredits = Math.max(
      0,
      subscription.monthlyCredits - subscription.usedMonthlyCredits,
    );
    const availablePurchasedCredits = subscription.purchasedCredits;
    const availableCredits =
      availableMonthlyCredits + availablePurchasedCredits;
    const canUseAIFeatures =
      (subscription.plan as string) === 'ai' &&
      (subscription.status as string) === 'active';

    return {
      ...subscription,
      availableCredits,
      availableMonthlyCredits,
      availablePurchasedCredits,
      canUseAIFeatures,
    };
  }
}
