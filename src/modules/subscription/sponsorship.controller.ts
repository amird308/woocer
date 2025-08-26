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
import { SponsorshipService } from './sponsorship.service';
import {
  CreateBulkSponsorshipRequestDto,
  GetOrganizationMembersForSponsorshipRequestDto,
} from './models/sponsorship.request';
import {
  SponsorshipResponseDto,
  SponsorshipWithUserInfoResponseDto,
  OrganizationMemberForSponsorshipResponseDto,
  BulkSponsorshipResponseDto,
  SponsorshipBillingSummaryResponseDto,
} from './models/sponsorship.response';

@ApiTags('Employee Sponsorships')
@ApiBearerAuth()
@Controller('sponsorships')
@UseGuards(AuthGuard)
export class SponsorshipController {
  constructor(private readonly sponsorshipService: SponsorshipService) {}

  @Get('organizations/:organizationId/members')
  @RequirePermissions({ organization: ['owner'] })
  @ApiOperation({
    summary: 'Get organization members for sponsorship management',
    description:
      'Returns list of organization members with their current sponsorship status',
  })
  @ApiResponse({
    status: 200,
    description: 'Organization members retrieved successfully',
    type: [OrganizationMemberForSponsorshipResponseDto],
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only organization owners can view members',
  })
  async getOrganizationMembersForSponsorship(
    @CurrentUser() user: UserEntity,
    @Param('organizationId') organizationId: string,
    @Query() filters: GetOrganizationMembersForSponsorshipRequestDto,
  ): Promise<OrganizationMemberForSponsorshipResponseDto[]> {
    return this.sponsorshipService.getOrganizationMembersForSponsorship(
      organizationId,
      user.id,
      filters,
    );
  }

  @Post('bulk/organizations/:organizationId')
  @RequirePermissions({ organization: ['owner'] })
  @ApiOperation({
    summary: 'Create bulk employee sponsorships',
    description:
      'Creates individual subscriptions sponsored by the organization owner',
  })
  @ApiResponse({
    status: 201,
    description: 'Bulk sponsorships created successfully',
    type: BulkSponsorshipResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid employee IDs or validation errors',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only organization owners can create sponsorships',
  })
  async createBulkSponsorship(
    @CurrentUser() user: UserEntity,
    @Param('organizationId') organizationId: string,
    @Body() createDto: CreateBulkSponsorshipRequestDto,
  ): Promise<BulkSponsorshipResponseDto> {
    return this.sponsorshipService.createBulkSponsorship(
      organizationId,
      user.id,
      createDto,
    );
  }

  @Get('organizations/:organizationId/sponsored')
  @RequirePermissions({ organization: ['owner'] })
  @ApiOperation({
    summary: 'Get sponsored employees for an organization',
    description:
      'Returns all employees currently sponsored by the organization owner',
  })
  @ApiResponse({
    status: 200,
    description: 'Sponsored employees retrieved successfully',
    type: [SponsorshipWithUserInfoResponseDto],
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only organization owners can view sponsorships',
  })
  async getSponsoredEmployees(
    @CurrentUser() user: UserEntity,
    @Param('organizationId') organizationId: string,
  ): Promise<SponsorshipWithUserInfoResponseDto[]> {
    return this.sponsorshipService.getSponsoredEmployees(
      organizationId,
      user.id,
    );
  }

  @Delete(':sponsorshipId')
  @RequirePermissions({ organization: ['owner'] })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel employee sponsorship',
    description:
      'Cancels an active employee sponsorship and reverts subscription to trial',
  })
  @ApiResponse({
    status: 200,
    description: 'Sponsorship cancelled successfully',
    type: SponsorshipResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Sponsorship not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - You can only cancel your own sponsorships',
  })
  async cancelSponsorship(
    @CurrentUser() user: UserEntity,
    @Param('sponsorshipId') sponsorshipId: string,
  ): Promise<SponsorshipResponseDto> {
    return this.sponsorshipService.cancelSponsorship(sponsorshipId, user.id);
  }

  @Get('organizations/:organizationId/billing')
  @RequirePermissions({ organization: ['owner'] })
  @ApiOperation({
    summary: 'Get sponsorship billing summary',
    description:
      'Returns billing information for all sponsorships in the organization',
  })
  @ApiResponse({
    status: 200,
    description: 'Billing summary retrieved successfully',
    type: SponsorshipBillingSummaryResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only organization owners can view billing',
  })
  async getSponsorshipBilling(
    @CurrentUser() user: UserEntity,
    @Param('organizationId') organizationId: string,
  ): Promise<SponsorshipBillingSummaryResponseDto> {
    return this.sponsorshipService.getSponsorshipBilling(
      organizationId,
      user.id,
    );
  }
}
