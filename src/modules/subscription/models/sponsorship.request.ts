import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsOptional,
  IsUUID,
  IsArray,
  ArrayNotEmpty,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SubscriptionPlan, Role } from '../../../common/entities';

export class CreateSponsorshipRequestDto {
  @ApiProperty({ description: 'Employee user ID to sponsor' })
  @IsUUID()
  employeeUserId: string;

  @ApiProperty({
    enum: SubscriptionPlan,
    description: 'Subscription plan to sponsor (PRO or AI)',
  })
  @IsEnum([SubscriptionPlan.PRO, SubscriptionPlan.AI])
  plan: SubscriptionPlan;
}

export class CreateBulkSponsorshipRequestDto {
  @ApiProperty({
    description: 'List of employees to sponsor',
    type: [CreateSponsorshipRequestDto],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateSponsorshipRequestDto)
  employees: CreateSponsorshipRequestDto[];
}

export class GetOrganizationMembersForSponsorshipRequestDto {
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

  @ApiProperty({
    description: 'Show only members without sponsorship',
    required: false,
  })
  @IsOptional()
  showUnsponsored?: boolean;
}

export class UpdateSponsorshipRequestDto {
  @ApiProperty({
    enum: SubscriptionPlan,
    description: 'New subscription plan (PRO or AI)',
    required: false,
  })
  @IsOptional()
  @IsEnum([SubscriptionPlan.PRO, SubscriptionPlan.AI])
  plan?: SubscriptionPlan;

  @ApiProperty({
    description: 'New monthly cost override',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyCost?: number;
}
