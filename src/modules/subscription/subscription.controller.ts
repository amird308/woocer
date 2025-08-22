import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import {
  CreateSubscriptionRequestDto,
  UpdateSubscriptionRequestDto,
  ConsumeCreditsRequestDto,
} from './models/subscription.request';
import {
  SubscriptionResponseDto,
  SubscriptionWithCreditsResponseDto,
  CreditConsumptionResponseDto,
} from './models/subscription.response';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { UserEntity } from '../../common/entities';
import { ApiResponseDto } from '../../common/types/dto.responce';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionGuard)
@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  @RequirePermissions('subscription:create')
  @ApiOperation({ summary: 'Create a new subscription' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Subscription created successfully',
    type: SubscriptionResponseDto,
  })
  async createSubscription(
    @CurrentUser() user: UserEntity,
    @Body() createSubscriptionDto: CreateSubscriptionRequestDto,
  ): Promise<ApiResponseDto<SubscriptionResponseDto>> {
    // For now, we'll use the user's first organization
    // In a real implementation, this would come from the request context
    const organizationId = user.id; // This is a placeholder - should be actual organization ID

    const subscription = await this.subscriptionService.createSubscription(
      user.id,
      organizationId,
      createSubscriptionDto,
    );

    return {
      success: true,
      message: 'Subscription created successfully',
      data: subscription,
    };
  }

  @Get('current')
  @RequirePermissions('subscription:read')
  @ApiOperation({
    summary: 'Get current user subscription with credit details',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current subscription retrieved successfully',
    type: SubscriptionWithCreditsResponseDto,
  })
  async getCurrentSubscription(
    @CurrentUser() user: UserEntity,
  ): Promise<ApiResponseDto<SubscriptionWithCreditsResponseDto | null>> {
    // For now, we'll use the user's first organization
    const organizationId = user.id; // This is a placeholder - should be actual organization ID

    const subscription =
      await this.subscriptionService.getSubscriptionByUserAndOrganization(
        user.id,
        organizationId,
      );

    return {
      success: true,
      message: subscription
        ? 'Subscription retrieved successfully'
        : 'No subscription found',
      data: subscription,
    };
  }

  @Get(':id')
  @RequirePermissions('subscription:read')
  @ApiOperation({ summary: 'Get subscription by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription retrieved successfully',
    type: SubscriptionWithCreditsResponseDto,
  })
  async getSubscription(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<SubscriptionWithCreditsResponseDto>> {
    const subscription = await this.subscriptionService.getSubscriptionById(id);

    return {
      success: true,
      message: 'Subscription retrieved successfully',
      data: subscription,
    };
  }

  @Put(':id')
  @RequirePermissions('subscription:update')
  @ApiOperation({ summary: 'Update subscription' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription updated successfully',
    type: SubscriptionResponseDto,
  })
  async updateSubscription(
    @Param('id') id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionRequestDto,
  ): Promise<ApiResponseDto<SubscriptionResponseDto>> {
    const subscription = await this.subscriptionService.updateSubscription(
      id,
      updateSubscriptionDto,
    );

    return {
      success: true,
      message: 'Subscription updated successfully',
      data: subscription,
    };
  }

  @Post('consume-credits')
  @RequirePermissions('subscription:use')
  @ApiOperation({ summary: 'Consume credits from current subscription' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Credits consumed successfully',
    type: CreditConsumptionResponseDto,
  })
  async consumeCredits(
    @CurrentUser() user: UserEntity,
    @Body() consumeCreditsDto: ConsumeCreditsRequestDto,
  ): Promise<ApiResponseDto<CreditConsumptionResponseDto>> {
    // For now, we'll use the user's first organization
    const organizationId = user.id; // This is a placeholder - should be actual organization ID

    const result = await this.subscriptionService.consumeCredits(
      user.id,
      organizationId,
      consumeCreditsDto,
    );

    return {
      success: true,
      message: `${result.creditsConsumed} credits consumed successfully`,
      data: result,
    };
  }

  @Post(':id/reset-monthly-credits')
  @RequirePermissions('subscription:admin')
  @ApiOperation({ summary: 'Reset monthly credits (admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Monthly credits reset successfully',
    type: SubscriptionResponseDto,
  })
  async resetMonthlyCredits(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<SubscriptionResponseDto>> {
    const subscription = await this.subscriptionService.resetMonthlyCredits(id);

    return {
      success: true,
      message: 'Monthly credits reset successfully',
      data: subscription,
    };
  }
}
