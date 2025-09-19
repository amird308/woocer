import {
  All,
  Body,
  Get,
  Headers,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { auth } from '@auth/lib/auth';
import {
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  generateUniqueSlug,
  OrganizationEncryptionManager,
} from '@/common/utilities';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateOrganizationRequestDto } from './models/organization.request';
import {
  GenerateUserSecretsResponseDto,
  GetUserOrganizationsResponseDto,
} from './models/user-secret.response';
import { UserSecretService } from './user-secret.service';

@ApiTags('Auth')
export class AuthController {
  constructor(private readonly userSecretService: UserSecretService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('auth/organization/create')
  @ApiOperation({
    summary: 'Create a new store/organization (legacy endpoint)',
  })
  @ApiResponse({
    status: 201,
    description: 'Store created successfully',
  })
  async createOrganization(
    @Body() body: CreateOrganizationRequestDto,
    @Headers() headers: any,
  ) {
    // Encrypt organization credentials for backend storage
    const processedData = OrganizationEncryptionManager.processOrganizationData(
      {
        consumerKey: body.consumerKey,
        consumerSecret: body.consumerSecret,
      },
    );

    const organizationData = {
      ...body,
      consumerKey: processedData.consumerKey,
      consumerSecret: processedData.consumerSecret,
      slug: body?.slug || generateUniqueSlug(body.name),
    };

    const data = await auth.api.createOrganization({
      body: organizationData,
      headers: headers,
    });

    return {
      message: 'Organization created successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('auth/organization/user-secrets/generate')
  @ApiOperation({
    summary:
      'Generate or regenerate user-specific encrypted secrets for all organizations',
    description:
      'Checks what organizations the user is a member of, creates or recreates user secrets per organization, and returns list with public and private keys.',
  })
  @ApiResponse({
    status: 200,
    description: 'User secrets generated successfully',
    type: GenerateUserSecretsResponseDto,
  })
  async generateUserSecrets(
    @CurrentUser() user: any,
  ): Promise<GenerateUserSecretsResponseDto> {
    return this.userSecretService.generateUserSecrets(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('auth/organization/user-organizations')
  @ApiOperation({
    summary: 'Get user organizations with user-specific public keys',
    description:
      'Returns user organizations with their user-specific public keys and encrypted data.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of user organizations with encrypted data',
    type: GetUserOrganizationsResponseDto,
  })
  async getUserOrganizations(
    @CurrentUser() user: any,
  ): Promise<GetUserOrganizationsResponseDto> {
    return this.userSecretService.getUserOrganizations(user.id);
  }

  @ApiExcludeEndpoint()
  @All('auth/*')
  async handleAuth(@Req() req: Request, @Res() res: Response) {
    // Pass the request to Better Auth
    return toNodeHandler(auth)(req, res);
  }
}
