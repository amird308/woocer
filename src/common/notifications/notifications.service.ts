import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { MessageService } from './message.service';

interface OneSignalNotification {
  app_id: string;
  include_player_ids?: string[];
  include_external_user_ids?: string[];
  contents: {
    [key: string]: string;
  };
  headings?: {
    [key: string]: string;
  };
  data?: Record<string, any>;
  url?: string;
  web_url?: string;
  app_url?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly oneSignalAppId = process.env.ONESIGNAL_APP_ID;
  private readonly oneSignalApiKey = process.env.ONESIGNAL_API_KEY;
  private readonly oneSignalApiUrl =
    'https://onesignal.com/api/v1/notifications';

  constructor(
    private prisma: PrismaService,
    private messageService: MessageService,
  ) {}

  /**
   * Send notification to specific users using message key
   */
  async sendToUsers(
    userIds: string[],
    messageKey: string,
    variables: Record<string, any> = {},
    options?: {
      data?: Record<string, any>;
      url?: string;
    },
  ): Promise<boolean> {
    try {
      // Get users' signal IDs and languages from database
      const users = await this.prisma.user.findMany({
        where: {
          id: { in: userIds },
          signalId: { not: null },
        },
        select: {
          id: true,
          signalId: true,
          language: true,
        },
      });

      if (users.length === 0) {
        this.logger.warn('No users found with valid signal IDs');
        return false;
      }
      const usersByLanguage = users.reduce(
        (acc, user) => {
          const lang = user.language || 'en';
          if (!acc[lang]) acc[lang] = [];
          acc[lang].push(user);
          return acc;
        },
        {} as Record<string, typeof users>,
      );

      // Send notifications for each language group
      const promises = Object.entries(usersByLanguage).map(
        ([language, languageUsers]) => {
          const message = this.messageService.getMessage(
            messageKey,
            language,
            variables,
          );

          if (!message) {
            this.logger.warn(
              `No message found for key: ${messageKey}, language: ${language}`,
            );
            return Promise.resolve(false);
          }

          const signalIds = languageUsers
            .map((user) => user.signalId)
            .filter(Boolean) as string[];

          return this.sendNotification({
            app_id: this.oneSignalAppId!,
            include_player_ids: signalIds,
            contents: { [language]: message.content },
            headings: message.heading
              ? { [language]: message.heading }
              : undefined,
            data: { ...options?.data, messageKey, language },
            url: options?.url,
            web_url: options?.url,
            app_url: options?.url,
          });
        },
      );

      const results = await Promise.all(promises);
      return results.some((result) => result === true);
    } catch (error) {
      this.logger.error('Failed to send notification to users', error);
      return false;
    }
  }

  /**
   * Send notification to all users in an organization using message key
   */
  async sendToOrganization(
    organizationId: string,
    messageKey: string,
    variables: Record<string, any> = {},
    options?: {
      data?: Record<string, any>;
      url?: string;
    },
  ): Promise<boolean> {
    try {
      // Get all users in the organization with signal IDs
      const members = await this.prisma.member.findMany({
        where: {
          organizationId,
          user: {
            signalId: { not: null },
          },
        },
        include: {
          user: {
            select: {
              id: true,
              signalId: true,
              language: true,
            },
          },
        },
      });

      if (members.length === 0) {
        this.logger.warn('No organization members found with valid signal IDs');
        return false;
      }
      // Group users by language
      const usersByLanguage = members.reduce(
        (acc, member) => {
          const lang = member.user.language || 'en';
          if (!acc[lang]) acc[lang] = [];
          acc[lang].push(member.user);
          return acc;
        },
        {} as Record<
          string,
          Array<{
            id: string;
            signalId: string | null;
            language: string | null;
          }>
        >,
      );

      // Send notifications for each language group
      const promises = Object.entries(usersByLanguage).map(
        ([language, languageUsers]) => {
          const message = this.messageService.getMessage(
            messageKey,
            language,
            variables,
          );

          if (!message) {
            this.logger.warn(
              `No message found for key: ${messageKey}, language: ${language}`,
            );
            return Promise.resolve(false);
          }

          const signalIds = languageUsers
            .map((user) => user.signalId)
            .filter(Boolean) as string[];

          return this.sendNotification({
            app_id: this.oneSignalAppId!,
            include_player_ids: signalIds,
            contents: { [language]: message.content },
            headings: message.heading
              ? { [language]: message.heading }
              : undefined,
            data: { ...options?.data, organizationId, messageKey, language },
            url: options?.url,
            web_url: options?.url,
            app_url: options?.url,
          });
        },
      );

      const results = await Promise.all(promises);
      return results.some((result) => result === true);
    } catch (error) {
      this.logger.error('Failed to send notification to organization', error);
      return false;
    }
  }

  /**
   * Update user's OneSignal player ID
   */
  async updateUserSignalId(userId: string, signalId: string): Promise<boolean> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { signalId },
      });

      this.logger.log(`Updated signal ID for user ${userId}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to update user signal ID', error);
      return false;
    }
  }

  /**
   * Send WooCommerce webhook notification to organization
   */
  async sendWooCommerceNotification(
    organizationId: string,
    webhookTopic: string,
    webhookData: any,
    options?: {
      data?: Record<string, any>;
      url?: string;
    },
  ): Promise<boolean> {
    try {
      // Extract variables from webhook data based on topic
      const variables = this.extractWooCommerceVariables(
        webhookTopic,
        webhookData,
      );

      return await this.sendToOrganization(
        organizationId,
        webhookTopic,
        variables,
        {
          data: {
            ...options?.data,
            webhookTopic,
            webhookId: webhookData.id,
          },
          url: options?.url,
        },
      );
    } catch (error) {
      this.logger.error('Failed to send WooCommerce notification', error);
      return false;
    }
  }

  /**
   * Extract variables from WooCommerce webhook data
   */
  private extractWooCommerceVariables(
    topic: string,
    data: any,
  ): Record<string, any> {
    const variables: Record<string, any> = {};

    switch (topic) {
      case 'order.created':
      case 'order.updated':
      case 'order.completed':
      case 'order.cancelled':
      case 'order.refunded':
      case 'order.failed':
      case 'order.processing':
      case 'order.on-hold':
        variables.orderId = data.id || data.number;
        variables.orderStatus = data.status;
        variables.orderTotal = data.total;
        variables.customerName = data.billing?.first_name
          ? `${data.billing.first_name} ${data.billing.last_name}`.trim()
          : data.billing?.email || 'Customer';
        break;

      case 'product.created':
      case 'product.updated':
      case 'product.deleted':
        variables.productId = data.id;
        variables.productName = data.name;
        variables.productPrice = data.price;
        variables.productSku = data.sku;
        break;

      case 'customer.created':
        variables.customerId = data.id;
        variables.customerName =
          `${data.first_name} ${data.last_name}`.trim() || data.email;
        variables.customerEmail = data.email;
        break;

      case 'coupon.created':
      case 'coupon.updated':
        variables.couponId = data.id;
        variables.couponCode = data.code;
        variables.couponAmount = data.amount;
        variables.couponType = data.discount_type;
        break;

      default:
        // For unknown topics, include basic data
        variables.id = data.id;
        variables.name = data.name || data.title || 'Item';
        break;
    }

    return variables;
  } /**
  
 * Get available message keys for WooCommerce
   */
  getWooCommerceMessageKeys(): string[] {
    return this.messageService
      .getAvailableMessageKeys()
      .filter(
        (key) =>
          key.startsWith('order.') ||
          key.startsWith('product.') ||
          key.startsWith('customer.') ||
          key.startsWith('coupon.'),
      );
  }

  /**
   * Send raw notification to OneSignal API
   */
  private async sendNotification(
    notification: OneSignalNotification,
  ): Promise<boolean> {
    try {
      if (!this.oneSignalAppId || !this.oneSignalApiKey) {
        this.logger.error('OneSignal credentials not configured');
        return false;
      }

      const response = await fetch(this.oneSignalApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${this.oneSignalApiKey}`,
        },
        body: JSON.stringify(notification),
      });

      const result = await response.json();

      if (response.ok) {
        this.logger.log('Notification sent successfully', result);
        return true;
      } else {
        this.logger.error('Failed to send notification', result);
        return false;
      }
    } catch (error) {
      this.logger.error('Error sending notification to OneSignal', error);
      return false;
    }
  }
}
