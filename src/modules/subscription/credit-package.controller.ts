import { Controller, Get, Param, UseGuards, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreditPackageService } from './credit-package.service';

import {
  CreditPackageResponseDto,
  CreditPackageWithValueResponseDto,
} from './models/credit-package.response';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { ApiResponseDto } from '../../common/types/dto.responce';

@ApiTags('Credit Packages')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionGuard)
@Controller('credit-packages')
export class CreditPackageController {
  constructor(private readonly creditPackageService: CreditPackageService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active credit packages' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Active credit packages retrieved successfully',
    type: [CreditPackageWithValueResponseDto],
  })
  async getActiveCreditPackages(): Promise<
    ApiResponseDto<CreditPackageWithValueResponseDto[]>
  > {
    const packages =
      await this.creditPackageService.getAllActiveCreditPackages();

    return {
      success: true,
      message: 'Active credit packages retrieved successfully',
      data: packages,
    };
  }

  @Get('all')
  @ApiOperation({
    summary: 'Get all credit packages including inactive (Admin only)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All credit packages retrieved successfully',
    type: [CreditPackageResponseDto],
  })
  async getAllCreditPackages(): Promise<
    ApiResponseDto<CreditPackageResponseDto[]>
  > {
    const packages = await this.creditPackageService.getAllCreditPackages();

    return {
      success: true,
      message: 'All credit packages retrieved successfully',
      data: packages,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get credit package by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Credit package retrieved successfully',
    type: CreditPackageWithValueResponseDto,
  })
  async getCreditPackage(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<CreditPackageWithValueResponseDto>> {
    const creditPackage =
      await this.creditPackageService.getCreditPackageById(id);

    return {
      success: true,
      message: 'Credit package retrieved successfully',
      data: creditPackage,
    };
  }
}
