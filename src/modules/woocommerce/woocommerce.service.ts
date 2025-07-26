import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import { createHash, createHmac } from 'node:crypto';
import { OrganizationEncryptionManager } from '../../common/utilities/encryption.util';

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
    console.log('Setting up webhooks for organization:', config);
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

    console.log('Webhooks to create:', api);
    try {
      for (const webhookData of webhooksToCreate) {
        const response = await api.post('webhooks', webhookData);
        console.log('Webhook created:', response.data);
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

  async processOrder(organizationId: string, orderData: any): Promise<void> {
    console.log('Processing order:', orderData);
  }

  async processProduct(productionId: string, productData: any): Promise<void> {
    console.log('Processing product:', productData);
  }

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

    try {
      // Decrypt the stored encrypted organization data
      const decryptedData =
        OrganizationEncryptionManager.decryptStoredOrganizationData({
          consumerKey: organization.consumerKey,
          consumerSecret: organization.consumerSecret,
        });

      return {
        organizationId: organization.id,
        wooCommerceUrl: organization.wooCommerceUrl,
        consumerKey: decryptedData.consumerKey,
        consumerSecret: decryptedData.consumerSecret,
      };
    } catch (error) {
      this.logger.error(
        `Failed to decrypt organization ${organizationId} WooCommerce config:`,
        error,
      );
      return null;
    }
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
