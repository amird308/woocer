import { ApiProperty } from '@nestjs/swagger';
import {
  EmployeeSubscriptionWithCreditsResponseDto,
  EmployeeAssignmentResponseDto,
} from './employee-subscription.response';
import { Role } from '@/common/entities';

export class OrganizationMemberResponseDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User name' })
  name?: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'Member role in organization' })
  role: Role;

  @ApiProperty({ description: 'Member ID' })
  memberId: string;

  @ApiProperty({ description: 'When user joined organization' })
  joinedAt: Date;

  @ApiProperty({
    description: 'Whether user already has employee subscription access',
    required: false,
  })
  hasEmployeeSubscription?: boolean;

  @ApiProperty({
    description: 'Current subscription plan if any',
    required: false,
  })
  currentSubscriptionPlan?: string;
}

export class BulkEmployeeSubscriptionResponseDto {
  @ApiProperty({ description: 'Created employee subscription details' })
  subscription: EmployeeSubscriptionWithCreditsResponseDto;

  @ApiProperty({
    description: 'List of employee assignments created',
    type: [EmployeeAssignmentResponseDto],
  })
  employeeAssignments: EmployeeAssignmentResponseDto[];

  @ApiProperty({ description: 'Total number of employees assigned' })
  totalEmployeesAssigned: number;

  @ApiProperty({
    description: 'List of employee user IDs that failed assignment',
    type: [String],
  })
  failedAssignments: string[];

  @ApiProperty({ description: 'Summary message' })
  summary: string;
}
