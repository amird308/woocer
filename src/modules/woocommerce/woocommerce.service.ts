import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import { createHash, createHmac } from 'crypto';

export interface WooCommerceConfig {
  organizationId: string;
  wooCommerceUrl: string;
  consumerKey: string;
  consumerSecret: string;
}

@Injectable()
export class WooCommerceService {
  private readonly logger = new Logger(WooCommerceService.name);

  constructor(private readonly prisma: PrismaService) {}

  private createApiClient(config: WooCommerceConfig) {
    return new WooCommerceRestApi({
      url: config.wooCommerceUrl,
      consumerKey: config.consumerKey,
      consumerSecret: config.consumerSecret,
      version: 'wc/v3',
    });
  }

  async setupWebhooks(config: WooCommerceConfig): Promise<void> {
    const api = this.createApiClient(config);
    const webhookSecret = this.generateWebhookSecret();

    // Define webhooks to create
    const webhooksToCreate = [
      {
        name: 'Order Created',
        topic: 'order.created',
        delivery_url: `${process.env.APP_URL}/api/woocommerce/webhooks/order/created`,
        secret: webhookSecret,
      },
      {
        name: 'Order Updated',
        topic: 'order.updated',
        delivery_url: `${process.env.APP_URL}/api/woocommerce/webhooks/order/updated`,
        secret: webhookSecret,
      },
      {
        name: 'Product Created',
        topic: 'product.created',
        delivery_url: `${process.env.APP_URL}/api/woocommerce/webhooks/product/created`,
        secret: webhookSecret,
      },
      {
        name: 'Product Updated',
        topic: 'product.updated',
        delivery_url: `${process.env.APP_URL}/api/woocommerce/webhooks/product/updated`,
        secret: webhookSecret,
      },
    ];

    try {
      for (const webhookData of webhooksToCreate) {
        const response = await api.post('webhooks', webhookData);

        await this.prisma.wooCommerceWebhook.create({
          data: {
            organizationId: config.organizationId,
            wooCommerceWebhookId: response.data.id,
            name: response.data.name,
            status: response.data.status,
            topic: response.data.topic,
            resource: response.data.topic.split('.')[0],
            event: response.data.topic.split('.')[1],
            deliveryUrl: response.data.delivery_url,
            secret: webhookSecret,
            dateCreated: new Date(response.data.date_created),
            dateModified: response.data.date_modified
              ? new Date(response.data.date_modified)
              : null,
          },
        });

        this.logger.log(
          `Created webhook: ${response.data.name} for organization ${config.organizationId}`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to create webhooks:', error);
      throw new BadRequestException('Failed to create webhooks');
    }
  }

  async processOrder(organizationId: string, orderData: any): Promise<void> {}

  async processProduct(productionId: string, productData: any): Promise<void> {}

  validateWebhookSignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    const computedSignature = createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('base64');

    return signature === computedSignature;
  }

  private generateWebhookSecret(): string {
    return createHash('sha256')
      .update(Date.now().toString() + Math.random().toString())
      .digest('hex');
  }

  async getOrganizationConfig(
    organizationId: string,
  ): Promise<WooCommerceConfig | null> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        wooCommerceUrl: true,
        consumerKey: true,
        consumerSecret: true,
      },
    });

    if (
      !organization?.wooCommerceUrl ||
      !organization?.consumerKey ||
      !organization?.consumerSecret
    ) {
      return null;
    }

    return {
      organizationId: organization.id,
      wooCommerceUrl: organization.wooCommerceUrl,
      consumerKey: organization.consumerKey,
      consumerSecret: organization.consumerSecret,
    };
  }

  async handleOrganizationCreated(organizationId: string): Promise<void> {
    const config = await this.getOrganizationConfig(organizationId);

    if (!config) {
      this.logger.warn(
        `Organization ${organizationId} missing WooCommerce configuration`,
      );
      return;
    }

    try {
      await this.setupWebhooks(config);

      this.logger.log(
        `Successfully set up WooCommerce integration for organization ${organizationId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to set up WooCommerce integration for organization ${organizationId}:`,
        error,
      );
    }
  }
}
