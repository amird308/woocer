import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../../common/entities';
import { EmployeeSubscriptionService } from './employee-subscription.service';
import {
  AssignEmployeeToSubscriptionRequestDto,
  ConsumeCreditsFromEmployeeSubscriptionRequestDto,
} from './models/employee-subscription.request';
import {
  CreateBulkEmployeeSubscriptionRequestDto,
  GetOrganizationMembersRequestDto,
} from './models/bulk-employee-subscription.request';
import {
  EmployeeSubscriptionWithCreditsResponseDto,
  EmployeeAssignmentResponseDto,
  EmployeeSubscriptionUsageReportResponseDto,
} from './models/employee-subscription.response';
import {
  OrganizationMemberResponseDto,
  BulkEmployeeSubscriptionResponseDto,
} from './models/bulk-employee-subscription.response';
import { CreditConsumptionResponseDto } from './models/subscription.response';

@ApiTags('Employee Subscriptions')
@ApiBearerAuth()
@Controller('employee-subscriptions')
@UseGuards(AuthGuard)
export class EmployeeSubscriptionController {
  constructor(
    private readonly employeeSubscriptionService: EmployeeSubscriptionService,
  ) {}

  @Get('organizations/:organizationId/members')
  @RequirePermissions('organization:owner')
  @ApiOperation({
    summary: 'Get organization members for subscription assignment',
  })
  @ApiResponse({
    status: 200,
    description: 'Organization members retrieved successfully',
    type: [OrganizationMemberResponseDto],
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only organization owners can view members',
  })
  async getOrganizationMembers(
    @CurrentUser() user: UserEntity,
    @Param('organizationId') organizationId: string,
    @Query() filters: GetOrganizationMembersRequestDto,
  ): Promise<OrganizationMemberResponseDto[]> {
    return this.employeeSubscriptionService.getOrganizationMembers(
      organizationId,
      user.id,
      filters,
    );
  }

  @Post('bulk/organizations/:organizationId')
  @RequirePermissions('organization:owner')
  @ApiOperation({
    summary: 'Create employee subscription for selected employees in bulk',
  })
  @ApiResponse({
    status: 201,
    description: 'Bulk employee subscription created successfully',
    type: BulkEmployeeSubscriptionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid employee IDs or validation errors',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - Only organization owners can create employee subscriptions',
  })
  async createBulkEmployeeSubscription(
    @CurrentUser() user: UserEntity,
    @Param('organizationId') organizationId: string,
    @Body() createDto: CreateBulkEmployeeSubscriptionRequestDto,
  ): Promise<BulkEmployeeSubscriptionResponseDto> {
    // Ensure the organizationId in the path matches the one in the body
    createDto.organizationId = organizationId;

    return this.employeeSubscriptionService.createBulkEmployeeSubscription(
      user.id,
      createDto,
    );
  }

  @Post(':subscriptionId/assign')
  @RequirePermissions('organization:owner')
  @ApiOperation({ summary: 'Assign employee to subscription' })
  @ApiResponse({
    status: 201,
    description: 'Employee assigned successfully',
    type: EmployeeAssignmentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - Only sponsor organization owners can assign employees',
  })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async assignEmployeeToSubscription(
    @CurrentUser() user: UserEntity,
    @Param('subscriptionId') subscriptionId: string,
    @Body() assignDto: AssignEmployeeToSubscriptionRequestDto,
  ): Promise<EmployeeAssignmentResponseDto> {
    return this.employeeSubscriptionService.assignEmployeeToSubscription(
      subscriptionId,
      user.id,
      assignDto,
    );
  }

  @Delete(':subscriptionId/revoke/:userId/organizations/:organizationId')
  @RequirePermissions('organization:owner')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke employee access to subscription' })
  @ApiResponse({
    status: 200,
    description: 'Employee access revoked successfully',
    type: EmployeeAssignmentResponseDto,
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - Only sponsor organization owners can revoke access',
  })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  async revokeEmployeeFromSubscription(
    @CurrentUser() user: UserEntity,
    @Param('subscriptionId') subscriptionId: string,
    @Param('userId') userId: string,
    @Param('organizationId') organizationId: string,
  ): Promise<EmployeeAssignmentResponseDto> {
    return this.employeeSubscriptionService.revokeEmployeeFromSubscription(
      subscriptionId,
      userId,
      organizationId,
      user.id,
    );
  }

  @Get('my-employee-subscriptions')
  @ApiOperation({ summary: 'Get all employee subscriptions for current user' })
  @ApiResponse({
    status: 200,
    description: 'Employee subscriptions retrieved successfully',
    type: [EmployeeSubscriptionWithCreditsResponseDto],
  })
  async getMyEmployeeSubscriptions(
    @CurrentUser() user: UserEntity,
  ): Promise<EmployeeSubscriptionWithCreditsResponseDto[]> {
    return this.employeeSubscriptionService.getEmployeeSubscriptionsForUser(
      user.id,
    );
  }

  @Get('my-subscription/organizations/:organizationId')
  @ApiOperation({
    summary: 'Get employee subscription for specific organization',
  })
  @ApiResponse({
    status: 200,
    description: 'Employee subscription retrieved successfully',
    type: EmployeeSubscriptionWithCreditsResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'No employee subscription found for this organization',
  })
  async getMyEmployeeSubscriptionForOrganization(
    @CurrentUser() user: UserEntity,
    @Param('organizationId') organizationId: string,
  ): Promise<EmployeeSubscriptionWithCreditsResponseDto | null> {
    return this.employeeSubscriptionService.getEmployeeSubscriptionByUserAndOrganization(
      user.id,
      organizationId,
    );
  }

  @Post(':subscriptionId/consume-credits')
  @ApiOperation({ summary: 'Consume credits from employee subscription' })
  @ApiResponse({
    status: 200,
    description: 'Credits consumed successfully',
    type: CreditConsumptionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Insufficient credits or bad request',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Subscription not active or not AI plan',
  })
  @ApiResponse({
    status: 404,
    description: 'Employee subscription access not found',
  })
  async consumeCreditsFromEmployeeSubscription(
    @CurrentUser() user: UserEntity,
    @Param('subscriptionId') subscriptionId: string,
    @Body() consumeDto: ConsumeCreditsFromEmployeeSubscriptionRequestDto,
  ): Promise<CreditConsumptionResponseDto> {
    return this.employeeSubscriptionService.consumeCreditsFromEmployeeSubscription(
      user.id,
      subscriptionId,
      consumeDto,
    );
  }

  @Get(':subscriptionId/usage-report')
  @RequirePermissions('organization:owner')
  @ApiOperation({ summary: 'Get employee subscription usage report' })
  @ApiResponse({
    status: 200,
    description: 'Usage report retrieved successfully',
    type: EmployeeSubscriptionUsageReportResponseDto,
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - Only sponsor organization owners can view reports',
  })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async getEmployeeSubscriptionUsageReport(
    @CurrentUser() user: UserEntity,
    @Param('subscriptionId') subscriptionId: string,
  ): Promise<EmployeeSubscriptionUsageReportResponseDto> {
    return this.employeeSubscriptionService.getEmployeeSubscriptionUsageReport(
      subscriptionId,
      user.id,
    );
  }
}
