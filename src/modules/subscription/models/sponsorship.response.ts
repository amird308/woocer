import { ApiProperty } from '@nestjs/swagger';
import {
  EmployeeSubscriptionSponsorshipEntity,
  SponsorshipBillingEntity,
  SubscriptionPlan,
  SubscriptionStatus,
} from '../../../common/entities';

export class SponsorshipResponseDto
  implements
    Pick<
      EmployeeSubscriptionSponsorshipEntity,
      | 'id'
      | 'subscriptionId'
      | 'sponsorUserId'
      | 'sponsoredUserId'
      | 'organizationId'
      | 'plan'
      | 'monthlyCost'
      | 'discountApplied'
      | 'originalPrice'
      | 'isActive'
      | 'sponsoredAt'
      | 'cancelledAt'
      | 'createdAt'
      | 'updatedAt'
    >
{
  @ApiProperty({ description: 'Sponsorship ID' })
  id: string;

  @ApiProperty({ description: 'Sponsored subscription ID' })
  subscriptionId: string;

  @ApiProperty({ description: 'Sponsor user ID (organization owner)' })
  sponsorUserId: string;

  @ApiProperty({ description: 'Sponsored user ID (employee)' })
  sponsoredUserId: string;

  @ApiProperty({ description: 'Organization ID' })
  organizationId: string;

  @ApiProperty({
    enum: SubscriptionPlan,
    description: 'Sponsored subscription plan',
  })
  plan: SubscriptionPlan;

  @ApiProperty({ description: 'Monthly cost for this sponsorship' })
  monthlyCost: number;

  @ApiProperty({
    description: 'Discount percentage applied',
    required: false,
  })
  discountApplied?: number;

  @ApiProperty({ description: 'Original price before discount' })
  originalPrice: number;

  @ApiProperty({ description: 'Whether sponsorship is active' })
  isActive: boolean;

  @ApiProperty({ description: 'When sponsorship started' })
  sponsoredAt: Date;

  @ApiProperty({
    description: 'When sponsorship was cancelled',
    required: false,
  })
  cancelledAt?: Date;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

export class SponsorshipWithUserInfoResponseDto extends SponsorshipResponseDto {
  @ApiProperty({ description: 'Sponsored user name' })
  sponsoredUserName: string;

  @ApiProperty({ description: 'Sponsored user email' })
  sponsoredUserEmail: string;

  @ApiProperty({ description: 'Sponsor user name' })
  sponsorUserName: string;

  @ApiProperty({ description: 'Organization name' })
  organizationName: string;

  @ApiProperty({
    enum: SubscriptionStatus,
    description: 'Current subscription status',
  })
  subscriptionStatus: SubscriptionStatus;

  @ApiProperty({ description: 'Current subscription available credits' })
  availableCredits: number;

  @ApiProperty({ description: 'Whether employee can use AI features' })
  canUseAIFeatures: boolean;
}

export class OrganizationMemberForSponsorshipResponseDto {
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'User name' })
  userName: string;

  @ApiProperty({ description: 'User email' })
  userEmail: string;

  @ApiProperty({ description: 'Member role in organization' })
  role: string;

  @ApiProperty({ description: 'Whether user has active sponsorship' })
  hasActiveSponsorship: boolean;

  @ApiProperty({
    description: 'Current sponsorship info',
    required: false,
  })
  currentSponsorship?: SponsorshipResponseDto;

  @ApiProperty({ description: "User's current subscription plan" })
  currentPlan: SubscriptionPlan;

  @ApiProperty({ description: "User's subscription status" })
  subscriptionStatus: SubscriptionStatus;
}

export class BulkSponsorshipResponseDto {
  @ApiProperty({ description: 'Successfully created sponsorships' })
  successful: SponsorshipWithUserInfoResponseDto[];

  @ApiProperty({ description: 'Failed sponsorship attempts with reasons' })
  failed: Array<{
    employeeUserId: string;
    reason: string;
    userName: string;
    userEmail: string;
  }>;

  @ApiProperty({ description: 'Summary of results' })
  summary: {
    totalRequested: number;
    successfulCount: number;
    failedCount: number;
    totalMonthlyCost: number;
  };
}

export class SponsorshipBillingResponseDto
  implements
    Pick<
      SponsorshipBillingEntity,
      | 'id'
      | 'sponsorshipId'
      | 'sponsorUserId'
      | 'billingPeriodStart'
      | 'billingPeriodEnd'
      | 'amount'
      | 'originalAmount'
      | 'discountAmount'
      | 'status'
      | 'revenueCatTransactionId'
      | 'createdAt'
      | 'updatedAt'
    >
{
  @ApiProperty({ description: 'Billing record ID' })
  id: string;

  @ApiProperty({ description: 'Sponsorship ID' })
  sponsorshipId: string;

  @ApiProperty({ description: 'Sponsor user ID' })
  sponsorUserId: string;

  @ApiProperty({ description: 'Billing period start' })
  billingPeriodStart: Date;

  @ApiProperty({ description: 'Billing period end' })
  billingPeriodEnd: Date;

  @ApiProperty({ description: 'Final amount charged' })
  amount: number;

  @ApiProperty({
    description: 'Original amount before discount',
    required: false,
  })
  originalAmount?: number;

  @ApiProperty({
    description: 'Discount amount saved',
    required: false,
  })
  discountAmount?: number;

  @ApiProperty({ description: 'Billing status' })
  status: string;

  @ApiProperty({
    description: 'RevenueCat transaction ID',
    required: false,
  })
  revenueCatTransactionId?: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

export class SponsorshipBillingSummaryResponseDto {
  @ApiProperty({
    description: 'Total monthly cost for all active sponsorships',
  })
  totalMonthlyCost: number;

  @ApiProperty({ description: 'Number of active sponsorships' })
  activeSponsorship: number;

  @ApiProperty({ description: 'Next billing date' })
  nextBillingDate: Date;

  @ApiProperty({
    description: 'Recent billing records',
    type: [SponsorshipBillingResponseDto],
  })
  billingHistory: SponsorshipBillingResponseDto[];

  @ApiProperty({
    description: 'Total amount saved through discounts this month',
  })
  totalDiscountSaved: number;

  @ApiProperty({ description: 'Organization name' })
  organizationName: string;
}
