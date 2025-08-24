import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';
import {
  SubscriptionEntity,
  SubscriptionPlan,
  SubscriptionStatus,
} from '../../../common/entities';

export class CreateSubscriptionRequestDto
  implements Partial<SubscriptionEntity>
{
  @ApiProperty({ description: 'RevenueCat customer ID', required: false })
  @IsOptional()
  @IsString()
  revenueCatCustomerId?: string;

  @ApiProperty({
    enum: SubscriptionPlan,
    description: 'Subscription plan type',
  })
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @ApiProperty({ enum: SubscriptionStatus, description: 'Subscription status' })
  @IsEnum(SubscriptionStatus)
  status: SubscriptionStatus;

  @ApiProperty({
    description: 'Billing period in months (14 days for trial)',
    example: 1,
  })
  @IsInt()
  @Min(1)
  billingPeriod: number;

  @ApiProperty({ description: 'Current period start date' })
  @IsDateString()
  currentPeriodStart: Date;

  @ApiProperty({ description: 'Current period end date' })
  @IsDateString()
  currentPeriodEnd: Date;
}

export class UpdateSubscriptionRequestDto
  implements Partial<SubscriptionEntity>
{
  @ApiProperty({
    enum: SubscriptionPlan,
    description: 'Subscription plan type',
    required: false,
  })
  @IsOptional()
  @IsEnum(SubscriptionPlan)
  plan?: SubscriptionPlan;

  @ApiProperty({
    enum: SubscriptionStatus,
    description: 'Subscription status',
    required: false,
  })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @ApiProperty({ description: 'Billing period in months', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  billingPeriod?: number;

  @ApiProperty({ description: 'Current period start date', required: false })
  @IsOptional()
  @IsDateString()
  currentPeriodStart?: Date;

  @ApiProperty({ description: 'Current period end date', required: false })
  @IsOptional()
  @IsDateString()
  currentPeriodEnd?: Date;

  @ApiProperty({ description: 'Total credits allocation', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  totalCredits?: number;

  @ApiProperty({ description: 'Used credits', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  usedCredits?: number;

  @ApiProperty({ description: 'Purchased credits', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  purchasedCredits?: number;
}

export class ConsumeCreditsRequestDto {
  @ApiProperty({ description: 'Number of credits to consume' })
  @IsInt()
  @Min(1)
  credits: number;

  @ApiProperty({ description: 'Description of the credit usage' })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Optional metadata for the transaction',
    required: false,
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
