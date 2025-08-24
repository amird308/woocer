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
  @ApiOperation({ summary: 'Create a personal subscription' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Subscription created successfully',
    type: SubscriptionResponseDto,
  })
  async createSubscription(
    @CurrentUser() user: UserEntity,
    @Body() createSubscriptionDto: CreateSubscriptionRequestDto,
  ): Promise<ApiResponseDto<SubscriptionResponseDto>> {
    const subscription = await this.subscriptionService.createSubscription(
      user.id,
      createSubscriptionDto,
    );

    return {
      success: true,
      message: 'Personal subscription created successfully',
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
    const subscription = await this.subscriptionService.getSubscriptionByUser(
      user.id,
    );

    return {
      success: true,
      message: subscription
        ? 'Personal subscription retrieved successfully'
        : 'No personal subscription found',
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
  @ApiOperation({ summary: 'Consume credits from personal subscription' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Credits consumed successfully',
    type: CreditConsumptionResponseDto,
  })
  async consumeCredits(
    @CurrentUser() user: UserEntity,
    @Body() consumeCreditsDto: ConsumeCreditsRequestDto,
  ): Promise<ApiResponseDto<CreditConsumptionResponseDto>> {
    const result = await this.subscriptionService.consumeCredits(
      user.id,
      consumeCreditsDto,
    );

    return {
      success: true,
      message: `${result.creditsConsumed} credits consumed successfully`,
      data: result,
    };
  }

  @Get('trial')
  @RequirePermissions('subscription:read')
  @ApiOperation({ summary: 'Get trial subscription status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Trial subscription status retrieved successfully',
    type: SubscriptionWithCreditsResponseDto,
  })
  async getTrialSubscription(
    @CurrentUser() user: UserEntity,
  ): Promise<ApiResponseDto<SubscriptionWithCreditsResponseDto | null>> {
    const subscription = await this.subscriptionService.getTrialSubscription(
      user.id,
    );

    return {
      success: true,
      message: subscription
        ? 'Trial subscription retrieved successfully'
        : 'No trial subscription found',
      data: subscription,
    };
  }

  @Post('trial')
  @RequirePermissions('subscription:create')
  @ApiOperation({ summary: 'Create trial subscription' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Trial subscription created successfully',
    type: SubscriptionResponseDto,
  })
  async createTrialSubscription(
    @CurrentUser() user: UserEntity,
  ): Promise<ApiResponseDto<SubscriptionResponseDto>> {
    const subscription = await this.subscriptionService.createTrialSubscription(
      user.id,
    );

    return {
      success: true,
      message: 'Trial subscription created successfully',
      data: subscription,
    };
  }

  @Post('trial/convert')
  @RequirePermissions('subscription:create')
  @ApiOperation({ summary: 'Convert trial to paid subscription' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Trial converted to paid subscription successfully',
    type: SubscriptionResponseDto,
  })
  async convertTrialToPaid(
    @CurrentUser() user: UserEntity,
    @Body() createSubscriptionDto: CreateSubscriptionRequestDto,
  ): Promise<ApiResponseDto<SubscriptionResponseDto>> {
    const subscription = await this.subscriptionService.convertTrialToPaid(
      user.id,
      createSubscriptionDto,
    );

    return {
      success: true,
      message: 'Trial converted to paid subscription successfully',
      data: subscription,
    };
  }

  @Post(':id/reset-period-credits')
  @RequirePermissions('subscription:admin')
  @ApiOperation({ summary: 'Reset period credits (admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Period credits reset successfully',
    type: SubscriptionResponseDto,
  })
  async resetPeriodCredits(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<SubscriptionResponseDto>> {
    const subscription = await this.subscriptionService.resetPeriodCredits(id);

    return {
      success: true,
      message: 'Period credits reset successfully',
      data: subscription,
    };
  }
}
