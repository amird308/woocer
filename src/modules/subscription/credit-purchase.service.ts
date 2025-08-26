import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SubscriptionService } from './subscription.service';
import { CreditPackageService } from './credit-package.service';
import {
  SubscriptionPlan,
  SubscriptionStatus,
  PurchaseStatus,
} from '../../common/entities';

export interface InitiatePurchaseRequest {
  creditPackageId: string;
}

export interface PurchaseValidationResponse {
  canPurchase: boolean;
  reason?: string;
  package?: any;
  subscription?: any;
}

@Injectable()
export class CreditPurchaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionService: SubscriptionService,
    private readonly creditPackageService: CreditPackageService,
  ) {}

  /**
   * Get credit packages
   */
  async getCreditPackages(): Promise<{ packages: any[] }> {
    const packages =
      await this.creditPackageService.getAllActiveCreditPackages();

    if (packages.length === 0) {
      throw new NotFoundException('No credit packages available');
    }

    // Sort packages by credits (ascending)
    const sortedPackages = packages.sort((a, b) => a.credits - b.credits);

    // Determine which package is recommended (middle one if 3+, larger if 2, only if 1)
    const recommendedIndex =
      sortedPackages.length === 1
        ? 0
        : sortedPackages.length === 2
          ? 1
          : Math.floor(sortedPackages.length / 2);

    const enrichedPackages = sortedPackages.map((pkg, index) => ({
      id: pkg.id,
      name: pkg.name,
      credits: pkg.credits,
      price: pkg.price,
      currency: pkg.currency,
      pricePerCredit: pkg.pricePerCredit,
      displayPrice: pkg.displayPrice,
      isRecommended: index === recommendedIndex,
    }));

    return {
      packages: enrichedPackages,
    };
  }

  /**
   * Validate if user can purchase credits
   */
  async validatePurchase(
    userId: string,
    creditPackageId: string,
  ): Promise<PurchaseValidationResponse> {
    // Get user's subscription
    const subscription =
      await this.subscriptionService.getSubscriptionByUser(userId);

    if (!subscription) {
      return {
        canPurchase: false,
        reason: 'No active subscription found',
      };
    }

    // Only AI plan subscribers can purchase credits
    if (subscription.plan !== SubscriptionPlan.AI) {
      return {
        canPurchase: false,
        reason: 'Only AI plan subscribers can purchase credits',
        subscription,
      };
    }

    // Check if subscription is active
    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      return {
        canPurchase: false,
        reason: 'Subscription is not active',
        subscription,
      };
    }

    // Get credit package
    let creditPackage;
    try {
      creditPackage =
        await this.creditPackageService.getCreditPackageById(creditPackageId);
    } catch {
      return {
        canPurchase: false,
        reason: 'Credit package not found',
      };
    }

    if (!creditPackage.isActive) {
      return {
        canPurchase: false,
        reason: 'Credit package is not available',
        package: creditPackage,
      };
    }

    return {
      canPurchase: true,
      package: creditPackage,
      subscription,
    };
  }

  /**
   * Initiate credit purchase (prepare for RevenueCat)
   */
  async initiatePurchase(
    userId: string,
    request: InitiatePurchaseRequest,
  ): Promise<{
    purchaseToken: string;
    package: any;
    subscription: any;
  }> {
    // Validate purchase
    const validation = await this.validatePurchase(
      userId,
      request.creditPackageId,
    );

    if (!validation.canPurchase) {
      throw new BadRequestException(validation.reason);
    }

    // Get organization ID for the purchase record
    const organizationId =
      validation.subscription!.sponsorshipInfo?.organizationId ||
      (
        await this.prisma.member.findFirst({
          where: { userId },
          select: { organizationId: true },
        })
      )?.organizationId;

    if (!organizationId) {
      throw new BadRequestException(
        'User must be part of an organization to purchase credits',
      );
    }

    // Create a pending purchase record
    const pendingPurchase = await this.prisma.creditPurchase.create({
      data: {
        userId,
        organizationId,
        subscriptionId: validation.subscription!.id,
        creditPackageId: request.creditPackageId,
        revenueCatTransactionId: `pending_${Date.now()}_${userId}`, // Temporary ID
        credits: validation.package!.credits,
        price: validation.package!.price,
        currency: validation.package!.currency,
        status: PurchaseStatus.PENDING,
        purchasedAt: new Date(),
      },
    });

    // Generate a secure purchase token
    const purchaseToken = `${pendingPurchase.id}_${Date.now()}`;

    return {
      purchaseToken,
      package: validation.package,
      subscription: validation.subscription,
    };
  }

  /**
   * Complete credit purchase (called by webhook)
   */
  async completePurchase(
    revenueCatTransactionId: string,
    creditPackageId: string,
    userId: string,
  ): Promise<void> {
    // Find the credit package
    const creditPackage =
      await this.creditPackageService.getCreditPackageById(creditPackageId);

    // Get user's subscription
    const subscription =
      await this.subscriptionService.getSubscriptionByUser(userId);

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Check if purchase already exists
    const existingPurchase = await this.prisma.creditPurchase.findUnique({
      where: { revenueCatTransactionId },
    });

    if (existingPurchase) {
      if (existingPurchase.status === PurchaseStatus.COMPLETED) {
        return; // Already processed
      }

      // Update existing purchase
      await this.prisma.creditPurchase.update({
        where: { id: existingPurchase.id },
        data: {
          status: PurchaseStatus.COMPLETED,
          purchasedAt: new Date(),
        },
      });
    } else {
      // Get organization ID
      const organizationId =
        subscription.sponsorshipInfo?.organizationId ||
        (
          await this.prisma.member.findFirst({
            where: { userId },
            select: { organizationId: true },
          })
        )?.organizationId;

      if (!organizationId) {
        throw new BadRequestException('User must be part of an organization');
      }

      // Create new purchase record
      await this.prisma.creditPurchase.create({
        data: {
          userId,
          organizationId,
          subscriptionId: subscription.id,
          creditPackageId,
          revenueCatTransactionId,
          credits: creditPackage.credits,
          price: creditPackage.price,
          currency: creditPackage.currency,
          status: PurchaseStatus.COMPLETED,
          purchasedAt: new Date(),
        },
      });
    }

    // Add credits to subscription
    await this.subscriptionService.addPurchasedCredits(
      subscription.id,
      creditPackage.credits,
    );
  }

  /**
   * Get user's purchase history
   */
  async getPurchaseHistory(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<{
    purchases: any[];
    total: number;
    hasMore: boolean;
  }> {
    const [purchases, total] = await Promise.all([
      this.prisma.creditPurchase.findMany({
        where: {
          userId,
          status: PurchaseStatus.COMPLETED,
        },
        include: {
          creditPackage: {
            select: {
              name: true,
              credits: true,
            },
          },
        },
        orderBy: { purchasedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.creditPurchase.count({
        where: {
          userId,
          status: PurchaseStatus.COMPLETED,
        },
      }),
    ]);

    return {
      purchases,
      total,
      hasMore: offset + purchases.length < total,
    };
  }

  /**
   * Cancel pending purchase
   */
  async cancelPendingPurchase(
    purchaseId: string,
    userId: string,
  ): Promise<void> {
    const purchase = await this.prisma.creditPurchase.findFirst({
      where: {
        id: purchaseId,
        userId,
        status: PurchaseStatus.PENDING,
      },
    });

    if (!purchase) {
      throw new NotFoundException('Pending purchase not found');
    }

    await this.prisma.creditPurchase.update({
      where: { id: purchaseId },
      data: { status: PurchaseStatus.FAILED },
    });
  }
}
