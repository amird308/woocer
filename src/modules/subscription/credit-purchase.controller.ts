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
  CreditPackageListResponseDto,
  PurchaseValidationResponseDto,
  InitiatePurchaseResponseDto,
  PurchaseHistoryResponseDto,
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

  @Get('packages')
  @RequirePermissions({ subscription: ['read'] })
  @ApiOperation({ summary: 'Get available credit packages' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Credit packages retrieved successfully',
    type: CreditPackageListResponseDto,
  })
  async getCreditPackages(): Promise<
    ApiResponseDto<CreditPackageListResponseDto>
  > {
    const packages = await this.creditPurchaseService.getCreditPackages();

    return {
      success: true,
      message: 'Credit packages retrieved successfully',
      data: packages,
    };
  }

  @Post('validate')
  @RequirePermissions({ subscription: ['use'] })
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
    const validation = await this.creditPurchaseService.validatePurchase(
      user.id,
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
  @RequirePermissions({ subscription: ['use'] })
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
    const result = await this.creditPurchaseService.initiatePurchase(
      user.id,
      request,
    );

    return {
      success: true,
      message: 'Purchase initiated successfully',
      data: result,
    };
  }

  @Get('history')
  @RequirePermissions({ subscription: ['read'] })
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
    const history = await this.creditPurchaseService.getPurchaseHistory(
      user.id,
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
  @RequirePermissions({ subscription: ['use'] })
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
}
