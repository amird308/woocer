import { ApiProperty } from '@nestjs/swagger';
import {
  SubscriptionEntity,
  SubscriptionPlan,
  SubscriptionStatus,
  EmployeeSubscriptionEntity,
} from '../../../common/entities';

export class EmployeeSubscriptionWithCreditsResponseDto
  implements
    Pick<
      SubscriptionEntity,
      | 'id'
      | 'plan'
      | 'status'
      | 'currentPeriodStart'
      | 'currentPeriodEnd'
      | 'purchasedCredits'
      | 'isActive'
      | 'isEmployeeSubscription'
      | 'sponsorOrganizationId'
      | 'maxEmployees'
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

  @ApiProperty({ description: 'Whether this is an employee subscription' })
  isEmployeeSubscription: boolean;

  @ApiProperty({
    description: 'Organization ID that sponsors this subscription',
  })
  sponsorOrganizationId?: string;

  @ApiProperty({ description: 'Discount percentage applied' })
  discountPercentage?: number;

  @ApiProperty({ description: 'Maximum employees allowed' })
  maxEmployees?: number;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;

  @ApiProperty({
    description: 'Total available credits (monthly + purchased - used)',
  })
  availableCredits: number;

  @ApiProperty({ description: 'Available total credits (total - used)' })
  availableTotalCredits: number;

  @ApiProperty({ description: 'Available purchased credits' })
  availablePurchasedCredits: number;

  @ApiProperty({ description: 'Whether user can use AI features' })
  canUseAIFeatures: boolean;

  @ApiProperty({ description: 'Current assigned employees count' })
  assignedEmployeesCount: number;

  @ApiProperty({
    description: 'Organization name that sponsors this subscription',
  })
  sponsorOrganizationName?: string;
}

export class EmployeeAssignmentResponseDto
  implements
    Pick<
      EmployeeSubscriptionEntity,
      | 'id'
      | 'subscriptionId'
      | 'userId'
      | 'organizationId'
      | 'isActive'
      | 'assignedAt'
      | 'revokedAt'
      | 'createdAt'
      | 'updatedAt'
    >
{
  @ApiProperty({ description: 'Assignment ID' })
  id: string;

  @ApiProperty({ description: 'Subscription ID' })
  subscriptionId: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Organization ID' })
  organizationId: string;

  @ApiProperty({ description: 'Whether assignment is active' })
  isActive: boolean;

  @ApiProperty({ description: 'When the assignment was created' })
  assignedAt: Date;

  @ApiProperty({
    description: 'When the assignment was revoked',
    required: false,
  })
  revokedAt?: Date;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

export class EmployeeSubscriptionUsageReportResponseDto {
  @ApiProperty({ description: 'Subscription details' })
  subscription: EmployeeSubscriptionWithCreditsResponseDto;

  @ApiProperty({ description: 'Total credits used across all organizations' })
  totalCreditsUsed: number;

  @ApiProperty({
    description: 'Current assigned employees',
    type: [EmployeeAssignmentResponseDto],
  })
  assignedEmployees: EmployeeAssignmentResponseDto[];
}
