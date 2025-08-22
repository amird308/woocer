import {
  Controller,
  Post,
  Body,
  Headers,
  HttpStatus,
  HttpCode,
  Logger,
  BadRequestException,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { Request } from 'express';
import { WebhookService } from './webhook.service';
import { RevenueCatWebhookDto } from './models/webhook.request';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly webhookService: WebhookService) {}

  @Post('revenuecat')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint() // Exclude from Swagger docs for security
  @ApiOperation({ summary: 'Handle RevenueCat webhook events' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook processed successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid webhook signature or payload',
  })
  async handleRevenueCatWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Body() webhookData: RevenueCatWebhookDto,
    @Headers('authorization') authorization?: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get the raw body for signature verification
      const rawBody = req.rawBody;
      if (!rawBody) {
        throw new BadRequestException(
          'Raw body required for signature verification',
        );
      }

      // Verify webhook signature if authorization header is present
      if (authorization && process.env.REVENUECAT_WEBHOOK_SECRET) {
        const signature = authorization.replace('Bearer ', '');
        const isValid = this.webhookService.verifyWebhookSignature(
          rawBody.toString(),
          signature,
          process.env.REVENUECAT_WEBHOOK_SECRET,
        );

        if (!isValid) {
          this.logger.warn('Invalid webhook signature received');
          throw new BadRequestException('Invalid webhook signature');
        }
      }

      // Process the webhook
      await this.webhookService.processRevenueCatWebhook(webhookData);

      this.logger.log(
        `Successfully processed webhook: ${webhookData.event_type}`,
      );

      return {
        success: true,
        message: 'Webhook processed successfully',
      };
    } catch (error) {
      this.logger.error('Error processing RevenueCat webhook:', error);

      // Return success to RevenueCat to avoid retries for client errors
      if (error.status >= 400 && error.status < 500) {
        return {
          success: false,
          message: error.message,
        };
      }

      throw error;
    }
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test webhook endpoint for development' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Test webhook processed successfully',
  })
  async testWebhook(
    @Body() webhookData: RevenueCatWebhookDto,
  ): Promise<{ success: boolean; message: string; data?: any }> {
    if (process.env.NODE_ENV === 'production') {
      throw new BadRequestException('Test webhook not available in production');
    }

    try {
      this.logger.log(`Test webhook received: ${webhookData.event_type}`);

      // In test mode, we'll just log the webhook data without processing
      this.logger.debug(
        'Test webhook data:',
        JSON.stringify(webhookData, null, 2),
      );

      return {
        success: true,
        message: 'Test webhook received successfully',
        data: webhookData,
      };
    } catch (error) {
      this.logger.error('Error processing test webhook:', error);
      throw error;
    }
  }
}
