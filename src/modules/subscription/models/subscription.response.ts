import { ApiProperty } from '@nestjs/swagger';
import {
  SubscriptionEntity,
  SubscriptionPlan,
  SubscriptionStatus,
} from '../../../common/entities';

export class SubscriptionResponseDto
  implements
    Pick<
      SubscriptionEntity,
      | 'id'
      | 'plan'
      | 'status'
      | 'billingPeriod'
      | 'currentPeriodStart'
      | 'currentPeriodEnd'
      | 'totalCredits'
      | 'usedCredits'
      | 'purchasedCredits'
      | 'isActive'
      | 'createdAt'
      | 'updatedAt'
    >
{
  @ApiProperty({ description: 'Subscription ID' })
  id: string;

  @ApiProperty({
    enum: SubscriptionPlan,
    description: 'Subscription plan type',
  })
  plan: SubscriptionPlan;

  @ApiProperty({ enum: SubscriptionStatus, description: 'Subscription status' })
  status: SubscriptionStatus;

  @ApiProperty({ description: 'Billing period in months (14 days for trial)' })
  billingPeriod: number;

  @ApiProperty({ description: 'Current period start date' })
  currentPeriodStart: Date;

  @ApiProperty({ description: 'Current period end date' })
  currentPeriodEnd: Date;

  @ApiProperty({ description: 'Total credits allocated for billing period' })
  totalCredits: number;

  @ApiProperty({ description: 'Credits used in current period' })
  usedCredits: number;

  @ApiProperty({ description: 'Additional purchased credits (never expire)' })
  purchasedCredits: number;

  @ApiProperty({ description: 'Whether subscription is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

export class SubscriptionWithCreditsResponseDto extends SubscriptionResponseDto {
  @ApiProperty({
    description: 'Total available credits (total + purchased - used)',
  })
  availableCredits: number;

  @ApiProperty({ description: 'Available total credits (total - used)' })
  availableTotalCredits: number;

  @ApiProperty({ description: 'Available purchased credits' })
  availablePurchasedCredits: number;

  @ApiProperty({ description: 'Whether user can use AI features' })
  canUseAIFeatures: boolean;

  @ApiProperty({ description: 'Whether this subscription is sponsored' })
  isSponsored: boolean;

  @ApiProperty({
    description: 'Sponsorship information if subscription is sponsored',
    required: false,
  })
  sponsorshipInfo?: {
    id: string;
    sponsorUserId: string;
    sponsorUserName: string;
    organizationId: string;
    organizationName: string;
    monthlyCost: number;
    sponsoredAt: Date;
  };
}

export class CreditConsumptionResponseDto {
  @ApiProperty({ description: 'Credits consumed' })
  creditsConsumed: number;

  @ApiProperty({ description: 'Credits consumed from total allocation' })
  totalCreditsUsed: number;

  @ApiProperty({ description: 'Credits consumed from purchased credits' })
  purchasedCreditsUsed: number;

  @ApiProperty({ description: 'Remaining available credits' })
  remainingCredits: number;

  @ApiProperty({ description: 'Transaction ID' })
  transactionId: string;
}
