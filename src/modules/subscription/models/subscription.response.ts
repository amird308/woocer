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
      | 'currentPeriodStart'
      | 'currentPeriodEnd'
      | 'monthlyCredits'
      | 'usedMonthlyCredits'
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

  @ApiProperty({ description: 'Current period start date' })
  currentPeriodStart: Date;

  @ApiProperty({ description: 'Current period end date' })
  currentPeriodEnd: Date;

  @ApiProperty({ description: 'Monthly credits allocation' })
  monthlyCredits: number;

  @ApiProperty({ description: 'Used monthly credits' })
  usedMonthlyCredits: number;

  @ApiProperty({ description: 'Purchased credits' })
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
    description: 'Total available credits (monthly + purchased - used)',
  })
  availableCredits: number;

  @ApiProperty({ description: 'Available monthly credits (monthly - used)' })
  availableMonthlyCredits: number;

  @ApiProperty({ description: 'Available purchased credits' })
  availablePurchasedCredits: number;

  @ApiProperty({ description: 'Whether user can use AI features' })
  canUseAIFeatures: boolean;
}

export class CreditConsumptionResponseDto {
  @ApiProperty({ description: 'Credits consumed' })
  creditsConsumed: number;

  @ApiProperty({ description: 'Credits consumed from monthly allocation' })
  monthlyCreditsUsed: number;

  @ApiProperty({ description: 'Credits consumed from purchased credits' })
  purchasedCreditsUsed: number;

  @ApiProperty({ description: 'Remaining available credits' })
  remainingCredits: number;

  @ApiProperty({ description: 'Transaction ID' })
  transactionId: string;
}
