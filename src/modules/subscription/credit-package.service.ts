import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

import {
  CreditPackageResponseDto,
  CreditPackageWithValueResponseDto,
} from './models/credit-package.response';

/**
 * Credit Package Service
 *
 * Note: Credit packages are created and managed in RevenueCat dashboard.
 * This service only provides read access to packages that are synced
 * from RevenueCat to the database.
 *
 * To add new packages:
 * 1. Create the package in RevenueCat dashboard
 * 2. Add the package to the database manually or via migration:
 *    INSERT INTO "CreditPackage" (id, name, credits, price, currency, "revenueCatProductId", "isActive", "sortOrder")
 *    VALUES (uuid_generate_v4(), 'Package Name', 100, 999, 'USD', 'rc_product_id', true, 1);
 */
@Injectable()
export class CreditPackageService {
  constructor(private readonly prisma: PrismaService) {}

  async getCreditPackageById(
    id: string,
  ): Promise<CreditPackageWithValueResponseDto> {
    const creditPackage = await this.prisma.creditPackage.findUnique({
      where: { id },
    });

    if (!creditPackage) {
      throw new NotFoundException('Credit package not found');
    }

    return this.enrichWithValueCalculations(creditPackage);
  }

  async getCreditPackageByRevenueCatId(
    revenueCatProductId: string,
  ): Promise<CreditPackageResponseDto> {
    const creditPackage = await this.prisma.creditPackage.findUnique({
      where: { revenueCatProductId },
    });

    if (!creditPackage) {
      throw new NotFoundException('Credit package not found');
    }

    return creditPackage;
  }

  async getAllActiveCreditPackages(): Promise<
    CreditPackageWithValueResponseDto[]
  > {
    const packages = await this.prisma.creditPackage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    // Calculate savings compared to the smallest package
    const enrichedPackages = packages.map((pkg) =>
      this.enrichWithValueCalculations(pkg),
    );

    // Find the package with the highest price per credit (usually the smallest)
    const highestPricePerCredit = Math.max(
      ...enrichedPackages.map((pkg) => pkg.pricePerCredit),
    );

    // Calculate savings percentage for each package
    return enrichedPackages.map((pkg) => ({
      ...pkg,
      savingsPercentage:
        pkg.pricePerCredit < highestPricePerCredit
          ? Math.round((1 - pkg.pricePerCredit / highestPricePerCredit) * 100)
          : 0,
    }));
  }

  async getAllCreditPackages(): Promise<CreditPackageResponseDto[]> {
    return this.prisma.creditPackage.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  private enrichWithValueCalculations(
    pkg: any,
  ): CreditPackageWithValueResponseDto {
    const pricePerCredit = pkg.price / pkg.credits;
    const displayPrice = this.formatPrice(pkg.price, pkg.currency);

    return {
      ...pkg,
      pricePerCredit,
      displayPrice,
    };
  }

  private formatPrice(priceInCents: number, currency: string): string {
    const price = priceInCents / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  }
}
