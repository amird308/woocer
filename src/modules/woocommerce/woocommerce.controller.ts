import {
  Controller,
  Post,
  Headers,
  RawBodyRequest,
  Request,
  Logger,
  HttpCode,
  HttpStatus,
  Body,
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
    @Body() body: Woocommerce.Order,
  ): Promise<{ success: boolean }> {
    console.log('handleOrderCreated', signature, webhookId, body);
    return this.wooCommerceService.handleWebhook(
      req,
      body,
      signature,
      webhookId,
      'order.created',
    );
  }

  @Post('webhooks/order/updated')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle WooCommerce order updated webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleOrderUpdated(
    @Request() req: RawBodyRequest<Request>,
    @Headers('x-wc-webhook-signature') signature: string,
    @Headers('x-wc-webhook-id') webhookId: string,
    @Body() body: Woocommerce.Order,
  ): Promise<{ success: boolean }> {
    return this.wooCommerceService.handleWebhook(
      req,
      body,
      signature,
      webhookId,
      'order.updated',
    );
  }

  @Post('webhooks/product/created')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle WooCommerce product created webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleProductCreated(
    @Request() req: RawBodyRequest<Request>,
    @Headers('x-wc-webhook-signature') signature: string,
    @Headers('x-wc-webhook-id') webhookId: string,
    @Body() body: Woocommerce.Product,
  ): Promise<{ success: boolean }> {
    return this.wooCommerceService.handleWebhook(
      req,
      body,
      signature,
      webhookId,
      'product.created',
    );
  }

  @Post('webhooks/product/updated')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle WooCommerce product updated webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleProductUpdated(
    @Request() req: RawBodyRequest<Request>,
    @Headers('x-wc-webhook-signature') signature: string,
    @Headers('x-wc-webhook-id') webhookId: string,
    @Body() body: Woocommerce.Product,
  ): Promise<{ success: boolean }> {
    return this.wooCommerceService.handleWebhook(
      req,
      body,
      signature,
      webhookId,
      'product.updated',
    );
  }
}
