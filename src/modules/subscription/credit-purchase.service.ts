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

export interface TieredPricingResponse {
  packages: Array<{
    id: string;
    name: string;
    credits: number;
    price: number;
    currency: string;
    pricePerCredit: number;
    savingsPercentage: number;
    displayPrice: string;
    isRecommended: boolean;
    tier: 'starter' | 'popular' | 'best_value';
  }>;
  recommendedPackageId: string;
}

@Injectable()
export class CreditPurchaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionService: SubscriptionService,
    private readonly creditPackageService: CreditPackageService,
  ) {}

  /**
   * Get tiered pricing with recommendations
   */
  async getTieredPricing(): Promise<TieredPricingResponse> {
    const packages =
      await this.creditPackageService.getAllActiveCreditPackages();

    if (packages.length === 0) {
      throw new NotFoundException('No credit packages available');
    }

    // Sort packages by credits (ascending)
    const sortedPackages = packages.sort((a, b) => a.credits - b.credits);

    // Calculate tiers and recommendations
    const tieredPackages = sortedPackages.map((pkg, index) => {
      let tier: 'starter' | 'popular' | 'best_value' = 'starter';
      let isRecommended = false;

      if (sortedPackages.length === 1) {
        tier = 'popular';
        isRecommended = true;
      } else if (sortedPackages.length === 2) {
        tier = index === 0 ? 'starter' : 'best_value';
        isRecommended = index === 1; // Recommend the larger package
      } else {
        // For 3+ packages
        if (index === 0) {
          tier = 'starter';
        } else if (index === Math.floor(sortedPackages.length / 2)) {
          tier = 'popular';
          isRecommended = true; // Recommend the middle package
        } else if (index === sortedPackages.length - 1) {
          tier = 'best_value';
        } else {
          tier =
            index < Math.floor(sortedPackages.length / 2)
              ? 'starter'
              : 'best_value';
        }
      }

      return {
        id: pkg.id,
        name: pkg.name,
        credits: pkg.credits,
        price: pkg.price,
        currency: pkg.currency,
        pricePerCredit: pkg.pricePerCredit,
        savingsPercentage: pkg.savingsPercentage || 0,
        displayPrice: pkg.displayPrice,
        isRecommended,
        tier,
      };
    });

    // Find the recommended package ID
    const recommendedPackage = tieredPackages.find((pkg) => pkg.isRecommended);
    const recommendedPackageId = recommendedPackage?.id || sortedPackages[0].id;

    return {
      packages: tieredPackages,
      recommendedPackageId,
    };
  }

  /**
   * Validate if user can purchase credits
   */
  async validatePurchase(
    userId: string,
    organizationId: string,
    creditPackageId: string,
  ): Promise<PurchaseValidationResponse> {
    // Get user's subscription
    const subscription =
      await this.subscriptionService.getSubscriptionByUserAndOrganization(
        userId,
        organizationId,
      );

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
    organizationId: string,
    request: InitiatePurchaseRequest,
  ): Promise<{
    purchaseToken: string;
    package: any;
    subscription: any;
  }> {
    // Validate purchase
    const validation = await this.validatePurchase(
      userId,
      organizationId,
      request.creditPackageId,
    );

    if (!validation.canPurchase) {
      throw new BadRequestException(validation.reason);
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
    organizationId: string,
  ): Promise<void> {
    // Find the credit package
    const creditPackage =
      await this.creditPackageService.getCreditPackageById(creditPackageId);

    // Get user's subscription
    const subscription =
      await this.subscriptionService.getSubscriptionByUserAndOrganization(
        userId,
        organizationId,
      );

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
      revenueCatTransactionId,
    );
  }

  /**
   * Get user's purchase history
   */
  async getPurchaseHistory(
    userId: string,
    organizationId: string,
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
          organizationId,
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
          organizationId,
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

  /**
   * Get purchase analytics (admin only)
   */
  async getPurchaseAnalytics(
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalPurchases: number;
    totalRevenue: number;
    totalCreditssSold: number;
    topPackages: Array<{
      packageId: string;
      packageName: string;
      totalPurchases: number;
      totalRevenue: number;
    }>;
  }> {
    const whereClause: any = {
      status: PurchaseStatus.COMPLETED,
    };

    if (startDate && endDate) {
      whereClause.purchasedAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const [totalStats, topPackages] = await Promise.all([
      this.prisma.creditPurchase.aggregate({
        where: whereClause,
        _count: { id: true },
        _sum: {
          price: true,
          credits: true,
        },
      }),
      this.prisma.creditPurchase.groupBy({
        by: ['creditPackageId'],
        where: whereClause,
        _count: { id: true },
        _sum: { price: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ]);

    // Enrich top packages with package details
    const enrichedTopPackages = await Promise.all(
      topPackages.map(async (pkg) => {
        const packageDetails =
          await this.creditPackageService.getCreditPackageById(
            pkg.creditPackageId,
          );
        return {
          packageId: pkg.creditPackageId,
          packageName: packageDetails.name,
          totalPurchases: pkg._count.id,
          totalRevenue: pkg._sum.price || 0,
        };
      }),
    );

    return {
      totalPurchases: totalStats._count.id || 0,
      totalRevenue: totalStats._sum.price || 0,
      totalCreditssSold: totalStats._sum.credits || 0,
      topPackages: enrichedTopPackages,
    };
  }
}
