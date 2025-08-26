import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SubscriptionService } from './subscription.service';
import { CreditPackageService } from './credit-package.service';
import { CreditPurchaseService } from './credit-purchase.service';
import { RevenueCatWebhookDto } from './models/webhook.request';
import { SubscriptionPlan, SubscriptionStatus } from '../../common/entities';
import * as crypto from 'crypto';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionService: SubscriptionService,
    private readonly creditPackageService: CreditPackageService,
    private readonly creditPurchaseService: CreditPurchaseService,
  ) {}

  /**
   * Verify RevenueCat webhook signature
   */
  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload, 'utf8')
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex'),
      );
    } catch (error) {
      this.logger.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Process RevenueCat webhook events
   */
  async processRevenueCatWebhook(
    webhookData: RevenueCatWebhookDto,
  ): Promise<void> {
    this.logger.log(`Processing RevenueCat webhook: ${webhookData.event_type}`);

    try {
      switch (webhookData.event_type) {
        case 'INITIAL_PURCHASE':
          await this.handleInitialPurchase(webhookData);
          break;
        case 'RENEWAL':
          await this.handleRenewal(webhookData);
          break;
        case 'CANCELLATION':
          await this.handleCancellation(webhookData);
          break;
        case 'UNCANCELLATION':
          await this.handleUncancellation(webhookData);
          break;
        case 'NON_RENEWING_PURCHASE':
          await this.handleCreditPurchase(webhookData);
          break;
        case 'EXPIRATION':
          await this.handleExpiration(webhookData);
          break;
        case 'BILLING_ISSUE':
          await this.handleBillingIssue(webhookData);
          break;
        default:
          this.logger.warn(
            `Unhandled webhook event type: ${webhookData.event_type}`,
          );
      }
    } catch (error) {
      this.logger.error(
        `Error processing webhook ${webhookData.event_type}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Handle initial subscription purchase
   */
  private async handleInitialPurchase(
    webhookData: RevenueCatWebhookDto,
  ): Promise<void> {
    const { event } = webhookData;

    // Find user by RevenueCat app_user_id (should be our user ID)
    const user = await this.prisma.user.findUnique({
      where: { id: event.app_user_id },
    });

    if (!user) {
      throw new NotFoundException(`User not found: ${event.app_user_id}`);
    }
    // Determine subscription plan based on product ID
    const plan = this.getSubscriptionPlanFromProductId(event.product_id);

    // Create or update subscription
    const existingSubscription = await this.prisma.subscription.findFirst({
      where: {
        userId: user.id,
        isActive: true,
      },
    });

    if (existingSubscription) {
      // Update existing subscription
      await this.subscriptionService.updateSubscription(
        existingSubscription.id,
        {
          plan,
          status: SubscriptionStatus.ACTIVE,
          revenueCatCustomerId: event.original_app_user_id,
        },
      );
    } else {
      // Create new subscription
      await this.subscriptionService.createSubscription(user.id, {
        revenueCatCustomerId: event.original_app_user_id,
        plan,
      });
    }

    this.logger.log(
      `Initial purchase processed for user ${user.id}, plan: ${plan}`,
    );
  }

  /**
   * Handle subscription renewal
   */
  private async handleRenewal(
    webhookData: RevenueCatWebhookDto,
  ): Promise<void> {
    const { event } = webhookData;

    const subscription = await this.findSubscriptionByRevenueCatId(
      event.original_app_user_id,
    );
    if (!subscription) {
      throw new NotFoundException(
        `Subscription not found for RevenueCat customer: ${event.original_app_user_id}`,
      );
    }

    // Reset period credits
    await this.subscriptionService.resetPeriodCredits(subscription.id);

    this.logger.log(
      `Subscription renewed for customer ${event.original_app_user_id}`,
    );
  }

  /**
   * Handle subscription cancellation
   */
  private async handleCancellation(
    webhookData: RevenueCatWebhookDto,
  ): Promise<void> {
    const { event } = webhookData;

    const subscription = await this.findSubscriptionByRevenueCatId(
      event.original_app_user_id,
    );
    if (!subscription) {
      throw new NotFoundException(
        `Subscription not found for RevenueCat customer: ${event.original_app_user_id}`,
      );
    }

    await this.subscriptionService.updateSubscription(subscription.id, {
      status: SubscriptionStatus.CANCELED,
    });

    this.logger.log(
      `Subscription canceled for customer ${event.original_app_user_id}`,
    );
  }

  /**
   * Handle subscription uncancellation
   */
  private async handleUncancellation(
    webhookData: RevenueCatWebhookDto,
  ): Promise<void> {
    const { event } = webhookData;

    const subscription = await this.findSubscriptionByRevenueCatId(
      event.original_app_user_id,
    );
    if (!subscription) {
      throw new NotFoundException(
        `Subscription not found for RevenueCat customer: ${event.original_app_user_id}`,
      );
    }

    await this.subscriptionService.updateSubscription(subscription.id, {
      status: SubscriptionStatus.ACTIVE,
    });

    this.logger.log(
      `Subscription uncanceled for customer ${event.original_app_user_id}`,
    );
  }

  /**
   * Handle credit purchase (non-renewing purchase)
   */
  private async handleCreditPurchase(
    webhookData: RevenueCatWebhookDto,
  ): Promise<void> {
    const { event } = webhookData;

    const subscription = await this.findSubscriptionByRevenueCatId(
      event.original_app_user_id,
    );
    if (!subscription) {
      throw new NotFoundException(
        `Subscription not found for RevenueCat customer: ${event.original_app_user_id}`,
      );
    }

    // Only AI plan subscribers can purchase credits
    if (subscription.plan !== SubscriptionPlan.AI) {
      throw new BadRequestException(
        'Only AI plan subscribers can purchase credits',
      );
    }

    // Find the credit package
    const creditPackage =
      await this.creditPackageService.getCreditPackageByRevenueCatId(
        event.product_id,
      );

    // Complete the purchase using the credit purchase service
    await this.creditPurchaseService.completePurchase(
      event.transaction_id,
      creditPackage.id,
      subscription.userId,
    );

    this.logger.log(
      `Credit purchase processed: ${creditPackage.credits} credits for customer ${event.original_app_user_id}`,
    );
  }

  /**
   * Handle subscription expiration
   */
  private async handleExpiration(
    webhookData: RevenueCatWebhookDto,
  ): Promise<void> {
    const { event } = webhookData;

    const subscription = await this.findSubscriptionByRevenueCatId(
      event.original_app_user_id,
    );
    if (!subscription) {
      throw new NotFoundException(
        `Subscription not found for RevenueCat customer: ${event.original_app_user_id}`,
      );
    }

    await this.subscriptionService.updateSubscription(subscription.id, {
      status: SubscriptionStatus.CANCELED,
    });

    this.logger.log(
      `Subscription expired for customer ${event.original_app_user_id}`,
    );
  }

  /**
   * Handle billing issues
   */
  private async handleBillingIssue(
    webhookData: RevenueCatWebhookDto,
  ): Promise<void> {
    const { event } = webhookData;

    const subscription = await this.findSubscriptionByRevenueCatId(
      event.original_app_user_id,
    );
    if (!subscription) {
      throw new NotFoundException(
        `Subscription not found for RevenueCat customer: ${event.original_app_user_id}`,
      );
    }

    await this.subscriptionService.updateSubscription(subscription.id, {
      status: SubscriptionStatus.PAST_DUE,
    });

    this.logger.log(`Billing issue for customer ${event.original_app_user_id}`);
  }

  /**
   * Get subscription plan from RevenueCat product ID
   */
  private getSubscriptionPlanFromProductId(
    productId: string,
  ): SubscriptionPlan {
    // This should be configured based on your actual RevenueCat product IDs
    if (productId.includes('ai') || productId.includes('premium')) {
      return SubscriptionPlan.AI;
    }
    return SubscriptionPlan.PRO;
  }

  /**
   * Find subscription by RevenueCat customer ID
   */
  private async findSubscriptionByRevenueCatId(revenueCatCustomerId: string) {
    return this.prisma.subscription.findFirst({
      where: { revenueCatCustomerId },
    });
  }
}
