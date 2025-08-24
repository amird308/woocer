import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsUUID,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';
import {
  Role,
  SubscriptionPlan,
  SubscriptionStatus,
} from '../../../common/entities';

export class CreateBulkEmployeeSubscriptionRequestDto {
  @ApiProperty({ description: 'RevenueCat customer ID', required: false })
  @IsOptional()
  @IsString()
  revenueCatCustomerId?: string;

  @ApiProperty({
    enum: SubscriptionPlan,
    description: 'Subscription plan type (TRIAL, PRO, or AI)',
  })
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @ApiProperty({ enum: SubscriptionStatus, description: 'Subscription status' })
  @IsEnum(SubscriptionStatus)
  status: SubscriptionStatus;

  @ApiProperty({
    description: 'Billing period in months (14 for trial)',
    example: 1,
  })
  @IsInt()
  @Min(1)
  billingPeriod: number;

  @ApiProperty({
    description: 'List of employee user IDs to assign to this subscription',
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(4, { each: true })
  employeeUserIds: string[];

  @ApiProperty({
    description: 'Organization where employees will use the subscription',
  })
  @IsUUID()
  organizationId: string;
}

export class GetOrganizationMembersRequestDto {
  @ApiProperty({
    description: 'Filter by role',
    enum: Role,
    required: false,
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiProperty({
    description: 'Search by user name or email',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;
}
