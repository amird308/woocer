import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional, IsInt, Min } from 'class-validator';
import { SubscriptionPlan, SubscriptionStatus } from '../../../common/entities';

export class CreateSubscriptionRequestDto {
  @ApiProperty({
    enum: SubscriptionPlan,
    description: 'Subscription plan type',
    example: SubscriptionPlan.AI,
  })
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @ApiProperty({
    description: 'Billing period in months (1, 6, or 12)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  billingPeriod?: number;

  @ApiProperty({ description: 'RevenueCat customer ID', required: false })
  @IsOptional()
  @IsString()
  revenueCatCustomerId?: string;
}

export class UpdateSubscriptionRequestDto {
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

  @ApiProperty({ description: 'RevenueCat customer ID', required: false })
  @IsOptional()
  @IsString()
  revenueCatCustomerId?: string;
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
