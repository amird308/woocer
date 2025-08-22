import { ApiProperty } from '@nestjs/swagger';
import { CreditPurchaseEntity, PurchaseStatus } from '../../../common/entities';

export class CreditPurchaseResponseDto
  implements
    Pick<
      CreditPurchaseEntity,
      | 'id'
      | 'credits'
      | 'price'
      | 'currency'
      | 'status'
      | 'purchasedAt'
      | 'createdAt'
      | 'updatedAt'
    >
{
  @ApiProperty({ description: 'Purchase ID' })
  id: string;

  @ApiProperty({ description: 'Number of credits purchased' })
  credits: number;

  @ApiProperty({ description: 'Price paid in cents' })
  price: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ enum: PurchaseStatus, description: 'Purchase status' })
  status: PurchaseStatus;

  @ApiProperty({ description: 'Purchase date' })
  purchasedAt: Date;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

export class PurchaseHistoryResponseDto {
  @ApiProperty({ type: [CreditPurchaseResponseDto] })
  purchases: CreditPurchaseResponseDto[];

  @ApiProperty({ description: 'Total number of purchases' })
  total: number;

  @ApiProperty({ description: 'Whether there are more purchases available' })
  hasMore: boolean;
}

export class TieredPricingPackageDto {
  @ApiProperty({ description: 'Package ID' })
  id: string;

  @ApiProperty({ description: 'Package name' })
  name: string;

  @ApiProperty({ description: 'Number of credits' })
  credits: number;

  @ApiProperty({ description: 'Price in cents' })
  price: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Price per credit in cents' })
  pricePerCredit: number;

  @ApiProperty({ description: 'Savings percentage compared to base package' })
  savingsPercentage: number;

  @ApiProperty({ description: 'Formatted display price' })
  displayPrice: string;

  @ApiProperty({ description: 'Whether this package is recommended' })
  isRecommended: boolean;

  @ApiProperty({
    enum: ['starter', 'popular', 'best_value'],
    description: 'Package tier',
  })
  tier: 'starter' | 'popular' | 'best_value';
}

export class TieredPricingResponseDto {
  @ApiProperty({ type: [TieredPricingPackageDto] })
  packages: TieredPricingPackageDto[];

  @ApiProperty({ description: 'ID of the recommended package' })
  recommendedPackageId: string;
}

export class PurchaseValidationResponseDto {
  @ApiProperty({ description: 'Whether the purchase can proceed' })
  canPurchase: boolean;

  @ApiProperty({
    description: 'Reason if purchase cannot proceed',
    required: false,
  })
  reason?: string;

  @ApiProperty({ description: 'Package details', required: false })
  package?: any;

  @ApiProperty({ description: 'Subscription details', required: false })
  subscription?: any;
}

export class InitiatePurchaseResponseDto {
  @ApiProperty({ description: 'Secure purchase token for client-side use' })
  purchaseToken: string;

  @ApiProperty({ description: 'Package details' })
  package: any;

  @ApiProperty({ description: 'User subscription details' })
  subscription: any;
}

export class PurchaseAnalyticsResponseDto {
  @ApiProperty({ description: 'Total number of completed purchases' })
  totalPurchases: number;

  @ApiProperty({ description: 'Total revenue from purchases in cents' })
  totalRevenue: number;

  @ApiProperty({ description: 'Total credits sold' })
  totalCreditssSold: number;

  @ApiProperty({
    type: [Object],
    description: 'Top selling packages',
  })
  topPackages: Array<{
    packageId: string;
    packageName: string;
    totalPurchases: number;
    totalRevenue: number;
  }>;
}
