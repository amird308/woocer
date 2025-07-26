import {
  All,
  Body,
  Controller,
  Headers,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { auth } from '@auth/lib/auth';
import { ApiBearerAuth, ApiExcludeEndpoint } from '@nestjs/swagger';
import {
  generateUniqueSlug,
  OrganizationEncryptionManager,
} from '@/common/utilities';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CreateOrganizationRequestDto } from './models/organization.request';
import { WooCommerceService } from '../woocommerce/woocommerce.service';
@Controller()
export class AuthController {
  constructor(private readonly wooCommerceService: WooCommerceService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('api/auth/organization/create')
  async createOrganization(
    @Body() body: CreateOrganizationRequestDto,
    @Headers() headers: any,
  ) {
    if (body.consumerKey || body.consumerSecret) {
      const processedData =
        OrganizationEncryptionManager.processOrganizationData({
          consumerKey: body.consumerKey,
          consumerSecret: body.consumerSecret,
        });
      console.log('processedData', processedData);
    }

    const organizationData = {
      ...body,
      consumerKey: JSON.stringify(body.consumerKey),
      consumerSecret: JSON.stringify(body.consumerSecret),
      slug: body?.slug || generateUniqueSlug(body.name),
    };

    const data = await auth.api.createOrganization({
      body: organizationData,
      headers: headers,
    });

    // await this.wooCommerceService.handleOrganizationCreated(data.id);

    return { message: 'Organization created', data };
  }

  @ApiExcludeEndpoint()
  @All('api/auth/*')
  async handleAuth(@Req() req: Request, @Res() res: Response) {
    // Pass the request to Better Auth
    return toNodeHandler(auth)(req, res);
  }
}
