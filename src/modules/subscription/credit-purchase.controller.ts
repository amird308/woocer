import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CreditPurchaseService } from './credit-purchase.service';
import {
  InitiateCreditPurchaseRequestDto,
  ValidatePurchaseRequestDto,
} from './models/credit-purchase.request';
import {
  TieredPricingResponseDto,
  PurchaseValidationResponseDto,
  InitiatePurchaseResponseDto,
  PurchaseHistoryResponseDto,
  PurchaseAnalyticsResponseDto,
} from './models/credit-purchase.response';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { UserEntity } from '../../common/entities';
import { ApiResponseDto } from '../../common/types/dto.responce';

@ApiTags('Credit Purchases')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionGuard)
@Controller('credit-purchases')
export class CreditPurchaseController {
  constructor(private readonly creditPurchaseService: CreditPurchaseService) {}

  @Get('pricing')
  @RequirePermissions(['subscription:read'])
  @ApiOperation({ summary: 'Get tiered credit pricing with recommendations' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tiered pricing retrieved successfully',
    type: TieredPricingResponseDto,
  })
  async getTieredPricing(): Promise<ApiResponseDto<TieredPricingResponseDto>> {
    const pricing = await this.creditPurchaseService.getTieredPricing();

    return {
      success: true,
      message: 'Tiered pricing retrieved successfully',
      data: pricing,
    };
  }

  @Post('validate')
  @RequirePermissions(['subscription:use'])
  @ApiOperation({
    summary: 'Validate if user can purchase specific credit package',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Purchase validation completed',
    type: PurchaseValidationResponseDto,
  })
  async validatePurchase(
    @CurrentUser() user: UserEntity,
    @Body() request: ValidatePurchaseRequestDto,
  ): Promise<ApiResponseDto<PurchaseValidationResponseDto>> {
    // For now, we'll use the user's first organization
    const organizationId = user.id; // This is a placeholder - should be actual organization ID

    const validation = await this.creditPurchaseService.validatePurchase(
      user.id,
      organizationId,
      request.creditPackageId,
    );

    return {
      success: true,
      message: validation.canPurchase
        ? 'Purchase validation successful'
        : 'Purchase validation failed',
      data: validation,
    };
  }

  @Post('initiate')
  @RequirePermissions(['subscription:use'])
  @ApiOperation({
    summary: 'Initiate credit purchase (prepare for RevenueCat)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Purchase initiated successfully',
    type: InitiatePurchaseResponseDto,
  })
  async initiatePurchase(
    @CurrentUser() user: UserEntity,
    @Body() request: InitiateCreditPurchaseRequestDto,
  ): Promise<ApiResponseDto<InitiatePurchaseResponseDto>> {
    // For now, we'll use the user's first organization
    const organizationId = user.id; // This is a placeholder - should be actual organization ID

    const result = await this.creditPurchaseService.initiatePurchase(
      user.id,
      organizationId,
      request,
    );

    return {
      success: true,
      message: 'Purchase initiated successfully',
      data: result,
    };
  }

  @Get('history')
  @RequirePermissions(['subscription:read'])
  @ApiOperation({ summary: 'Get user purchase history' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of items to skip',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Purchase history retrieved successfully',
    type: PurchaseHistoryResponseDto,
  })
  async getPurchaseHistory(
    @CurrentUser() user: UserEntity,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<ApiResponseDto<PurchaseHistoryResponseDto>> {
    // For now, we'll use the user's first organization
    const organizationId = user.id; // This is a placeholder - should be actual organization ID

    const history = await this.creditPurchaseService.getPurchaseHistory(
      user.id,
      organizationId,
      limit ? parseInt(limit.toString()) : 20,
      offset ? parseInt(offset.toString()) : 0,
    );

    return {
      success: true,
      message: 'Purchase history retrieved successfully',
      data: history,
    };
  }

  @Post(':purchaseId/cancel')
  @RequirePermissions(['subscription:use'])
  @ApiOperation({ summary: 'Cancel pending purchase' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Purchase cancelled successfully',
  })
  async cancelPendingPurchase(
    @CurrentUser() user: UserEntity,
    @Param('purchaseId') purchaseId: string,
  ): Promise<ApiResponseDto<null>> {
    await this.creditPurchaseService.cancelPendingPurchase(purchaseId, user.id);

    return {
      success: true,
      message: 'Purchase cancelled successfully',
      data: null,
    };
  }

  @Get('analytics')
  @RequirePermissions(['subscription:admin'])
  @ApiOperation({ summary: 'Get purchase analytics (Admin only)' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date (ISO format)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date (ISO format)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Purchase analytics retrieved successfully',
    type: PurchaseAnalyticsResponseDto,
  })
  async getPurchaseAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<ApiResponseDto<PurchaseAnalyticsResponseDto>> {
    const analytics = await this.creditPurchaseService.getPurchaseAnalytics(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );

    return {
      success: true,
      message: 'Purchase analytics retrieved successfully',
      data: analytics,
    };
  }
}
