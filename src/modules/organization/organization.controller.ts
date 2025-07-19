import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OrganizationService } from './organization.service';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from './models/organization.request';
import {
  OrganizationResponseDto,
  OrganizationSummaryDto,
} from './models/organization.response';
import { PaginationDto } from '../../common/types/pagination.dto';
import { PaginationResponse } from '../../common/types/pagination.response';
import { ApiResponseDto } from '../../common/types/dto.responce';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('organizations')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('organizations')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new organization' })
  @ApiResponse({
    status: 201,
    description: 'Organization created successfully',
    type: OrganizationResponseDto,
  })
  async create(
    @Body() createOrganizationDto: CreateOrganizationDto,
    @CurrentUser() user: any,
  ): Promise<ApiResponseDto<OrganizationResponseDto>> {
    const organization = await this.organizationService.create(
      createOrganizationDto,
      user.id,
    );
    return ApiResponseDto.success(
      organization,
      'Organization created successfully',
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all organizations with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Organizations retrieved successfully',
  })
  async findAll(
    @Query() paginationDto: PaginationDto,
  ): Promise<ApiResponseDto<PaginationResponse<OrganizationSummaryDto>>> {
    const result = await this.organizationService.findAll(paginationDto);
    return ApiResponseDto.success(
      result,
      'Organizations retrieved successfully',
    );
  }

  @Get(':id')
  @UseGuards(PermissionGuard)
  @RequirePermissions({ organization: ['read'] })
  @ApiOperation({ summary: 'Get organization by ID' })
  @ApiResponse({
    status: 200,
    description: 'Organization retrieved successfully',
    type: OrganizationResponseDto,
  })
  async findOne(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<OrganizationResponseDto>> {
    const organization = await this.organizationService.findOne(id);
    return ApiResponseDto.success(
      organization,
      'Organization retrieved successfully',
    );
  }

  @Patch(':id')
  @UseGuards(PermissionGuard)
  @RequirePermissions({ organization: ['update'] })
  @ApiOperation({ summary: 'Update organization' })
  @ApiResponse({
    status: 200,
    description: 'Organization updated successfully',
    type: OrganizationResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ): Promise<ApiResponseDto<OrganizationResponseDto>> {
    const organization = await this.organizationService.update(
      id,
      updateOrganizationDto,
    );
    return ApiResponseDto.success(
      organization,
      'Organization updated successfully',
    );
  }

  @Delete(':id')
  @UseGuards(PermissionGuard)
  @RequirePermissions({ organization: ['delete'] })
  @ApiOperation({ summary: 'Delete organization' })
  @ApiResponse({
    status: 200,
    description: 'Organization deleted successfully',
  })
  async remove(@Param('id') id: string): Promise<ApiResponseDto<null>> {
    await this.organizationService.remove(id);
    return ApiResponseDto.success(null, 'Organization deleted successfully');
  }
}
