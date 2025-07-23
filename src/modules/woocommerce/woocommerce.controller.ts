import {
  Controller,
  Post,
  Headers,
  RawBodyRequest,
  Request,
  Logger,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WooCommerceService } from './woocommerce.service';

@ApiTags('WooCommerce')
@Controller('woocommerce')
export class WooCommerceController {
  private readonly logger = new Logger(WooCommerceController.name);

  constructor(private readonly wooCommerceService: WooCommerceService) {}

  @Post('webhooks/order/created')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle WooCommerce order created webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleOrderCreated(
    @Request() req: RawBodyRequest<Request>,
    @Headers('x-wc-webhook-signature') signature: string,
    @Headers('x-wc-webhook-id') webhookId: string,
  ): Promise<{ success: boolean }> {
    return this.handleWebhook(req, signature, webhookId, 'order.created');
  }

  @Post('webhooks/order/updated')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle WooCommerce order updated webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleOrderUpdated(
    @Request() req: RawBodyRequest<Request>,
    @Headers('x-wc-webhook-signature') signature: string,
    @Headers('x-wc-webhook-id') webhookId: string,
  ): Promise<{ success: boolean }> {
    return this.handleWebhook(req, signature, webhookId, 'order.updated');
  }

  @Post('webhooks/product/created')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle WooCommerce product created webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleProductCreated(
    @Request() req: RawBodyRequest<Request>,
    @Headers('x-wc-webhook-signature') signature: string,
    @Headers('x-wc-webhook-id') webhookId: string,
  ): Promise<{ success: boolean }> {
    return this.handleWebhook(req, signature, webhookId, 'product.created');
  }

  @Post('webhooks/product/updated')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle WooCommerce product updated webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleProductUpdated(
    @Request() req: RawBodyRequest<Request>,
    @Headers('x-wc-webhook-signature') signature: string,
    @Headers('x-wc-webhook-id') webhookId: string,
  ): Promise<{ success: boolean }> {
    return this.handleWebhook(req, signature, webhookId, 'product.updated');
  }

  private async handleWebhook(
    req: RawBodyRequest<Request>,
    signature: string,
    webhookId: string,
    topic: string,
  ): Promise<{ success: boolean }> {
    try {
      const payload = req.rawBody?.toString('utf8') || '';
      const data = JSON.parse(payload);

      // Find webhook configuration to get secret and organization
      const webhook = await this.wooCommerceService[
        'prisma'
      ].wooCommerceWebhook.findUnique({
        where: { wooCommerceWebhookId: parseInt(webhookId) },
        include: { organization: true },
      });

      if (!webhook) {
        this.logger.warn(`Webhook ${webhookId} not found`);
        throw new BadRequestException('Webhook not found');
      }

      // Validate webhook signature
      if (
        !this.wooCommerceService.validateWebhookSignature(
          payload,
          signature,
          webhook.secret,
        )
      ) {
        this.logger.warn(`Invalid signature for webhook ${webhookId}`);
        throw new BadRequestException('Invalid webhook signature');
      }

      // Process the webhook based on topic
      switch (topic) {
        case 'order.created':
        case 'order.updated':
          await this.wooCommerceService.processOrder(
            webhook.organizationId,
            data,
          );
          break;
        case 'product.created':
        case 'product.updated':
          await this.wooCommerceService.processProduct(
            webhook.organizationId,
            data,
          );
          break;
        default:
          this.logger.warn(`Unknown webhook topic: ${topic}`);
      }

      this.logger.log(`Processed webhook ${webhookId} for topic ${topic}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to process webhook ${webhookId}:`, error);
      throw new BadRequestException('Failed to process webhook');
    }
  }
}
