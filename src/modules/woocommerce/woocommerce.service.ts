import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '@common/notifications/notifications.service';
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import { createHash, createHmac } from 'node:crypto';
import { OrganizationEncryptionManager } from '../../common/utilities/encryption.util';
import { RawBodyRequest } from '@nestjs/common';

export interface WooCommerceConfig {
  organizationId: string;
  wooCommerceUrl: string;
  consumerKey: string;
  consumerSecret: string;
}

@Injectable()
export class WooCommerceService {
  private readonly logger = new Logger(WooCommerceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

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
        delivery_url: `${process.env.APP_URL}/woocommerce/webhooks/order/created`,
        secret: webhookSecret,
      },
      {
        name: 'Order Updated',
        topic: 'order.updated',
        delivery_url: `${process.env.APP_URL}/woocommerce/webhooks/order/updated`,
        secret: webhookSecret,
      },
      {
        name: 'Product Created',
        topic: 'product.created',
        delivery_url: `${process.env.APP_URL}/woocommerce/webhooks/product/created`,
        secret: webhookSecret,
      },
      {
        name: 'Product Updated',
        topic: 'product.updated',
        delivery_url: `${process.env.APP_URL}/woocommerce/webhooks/product/updated`,
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

  async processOrder(
    organizationId: string,
    orderData: any,
    webhookTopic?: string,
  ): Promise<void> {
    this.logger.log(
      `Processing order ${orderData.id} for organization ${organizationId}`,
    );

    try {
      // Use webhook topic if provided, otherwise determine from order status
      const topic = webhookTopic || this.getOrderNotificationTopic(orderData);

      if (topic) {
        // Send notification to organization members
        const notificationSent =
          await this.notificationsService.sendWooCommerceNotification(
            organizationId,
            topic,
            orderData,
            {
              data: {
                type: 'order_update',
                orderId: orderData.id,
                orderNumber: orderData.number,
                status: orderData.status,
                total: orderData.total,
                currency: orderData.currency,
              },
            },
          );

        if (notificationSent) {
          this.logger.log(
            `Sent ${topic} notification for order ${orderData.id}`,
          );
        } else {
          this.logger.warn(
            `Failed to send ${topic} notification for order ${orderData.id}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(`Failed to process order ${orderData.id}:`, error);
    }
  }

  async processProduct(
    organizationId: string,
    productData: any,
    webhookTopic?: string,
  ): Promise<void> {
    this.logger.log(
      `Processing product ${productData.id} for organization ${organizationId}`,
    );

    try {
      // Use webhook topic if provided, otherwise determine from product data
      const topic =
        webhookTopic || this.getProductNotificationTopic(productData);

      if (topic) {
        // Send notification to organization members
        const notificationSent =
          await this.notificationsService.sendWooCommerceNotification(
            organizationId,
            topic,
            productData,
            {
              data: {
                type: 'product_update',
                productId: productData.id,
                productName: productData.name,
                productSku: productData.sku,
                productPrice: productData.price,
                productStatus: productData.status,
              },
            },
          );

        if (notificationSent) {
          this.logger.log(
            `Sent ${topic} notification for product ${productData.id}`,
          );
        } else {
          this.logger.warn(
            `Failed to send ${topic} notification for product ${productData.id}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(`Failed to process product ${productData.id}:`, error);
    }
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

  /**
   * Determine the appropriate notification topic for an order based on its status
   */
  private getOrderNotificationTopic(orderData: any): string | null {
    const status = orderData.status?.toLowerCase();

    switch (status) {
      case 'completed':
        return 'order.completed';
      case 'processing':
        return 'order.processing';
      case 'on-hold':
        return 'order.on-hold';
      case 'cancelled':
        return 'order.cancelled';
      case 'refunded':
        return 'order.refunded';
      case 'failed':
        return 'order.failed';
      case 'pending':
        return 'order.created';
      default:
        // For any other status changes, use the generic updated topic
        return 'order.updated';
    }
  }

  /**
   * Determine the appropriate notification topic for a product
   */
  private getProductNotificationTopic(productData: any): string | null {
    // Since we don't have explicit action context, we'll use the generic topics
    // This could be enhanced based on webhook context or additional data
    if (productData.date_created && productData.date_modified) {
      const created = new Date(productData.date_created);
      const modified = new Date(productData.date_modified);

      // If created and modified are very close (within 1 minute), it's likely a new product
      if (Math.abs(modified.getTime() - created.getTime()) < 60000) {
        return 'product.created';
      }
    }

    // Default to updated for existing products
    return 'product.updated';
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

  async handleWebhook(
    req: RawBodyRequest<Request>,
    signature: string,
    webhookId: string,
    topic: string,
  ): Promise<{ success: boolean }> {
    try {
      const payload = req.rawBody?.toString('utf8') || '';
      const data = JSON.parse(payload);

      // Find webhook configuration to get secret and organization
      const webhook = await this.prisma.wooCommerceWebhook.findUnique({
        where: { wooCommerceWebhookId: parseInt(webhookId) },
        include: { organization: true },
      });

      if (!webhook) {
        this.logger.warn(`Webhook ${webhookId} not found`);
        throw new BadRequestException('Webhook not found');
      }

      // Validate webhook signature
      if (!this.validateWebhookSignature(payload, signature, webhook.secret)) {
        this.logger.warn(`Invalid signature for webhook ${webhookId}`);
        throw new BadRequestException('Invalid webhook signature');
      }

      // Process the webhook based on topic
      switch (topic) {
        case 'order.created':
        case 'order.updated':
          await this.processOrder(webhook.organizationId, data, topic);
          break;
        case 'product.created':
        case 'product.updated':
          await this.processProduct(webhook.organizationId, data, topic);
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
