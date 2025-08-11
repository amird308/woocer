# OneSignal Push Notifications Integration

This document explains how to use the OneSignal integration with the message directory system for sending localized push notifications to users.

## Setup

### 1. Environment Variables

Add the following environment variables to your `.env` file:

```env
# OneSignal Configuration
ONESIGNAL_APP_ID="your-onesignal-app-id"
ONESIGNAL_API_KEY="your-onesignal-api-key"
```

### 2. Database Schema

The integration adds two new fields to the `User` model:

- `signalId`: OneSignal player ID for push notifications
- `language`: User's preferred language (defaults to "en")

### 3. User Registration/Login

When users sign up or log in, you can now include `signalId` and `language` fields:

```typescript
// Example sign up with OneSignal integration
const userData = {
  email: "user@example.com",
  password: "password123",
  name: "John Doe",
  signalId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", // OneSignal player ID
  language: "en" // or "fa" for Persian, "ar" for Arabic
};
```

## Message Directory System

The notification system uses a structured message directory for organized, multi-language support. Messages are automatically localized based on user language preferences.

### Available Message Categories

#### WooCommerce Messages
- `order.created` - New order created
- `order.updated` - Order updated
- `order.completed` - Order completed
- `order.cancelled` - Order cancelled
- `order.refunded` - Order refunded
- `order.failed` - Order payment failed
- `order.processing` - Order being processed
- `order.on-hold` - Order on hold
- `product.created` - New product added
- `product.updated` - Product updated
- `product.deleted` - Product removed
- `customer.created` - New customer registered
- `coupon.created` - New coupon created
- `coupon.updated` - Coupon updated

#### General Messages
- `system.maintenance` - System maintenance notice
- `system.update` - System update notification
- `organization.member_added` - New team member
- `organization.member_removed` - Team member left
- `welcome.new_user` - Welcome message
- `error.sync_failed` - Synchronization error

### Supported Languages

- `en`: English (default)
- `fa`: Persian/Farsi
- `ar`: Arabic

### Message Variables

Messages support dynamic variables using `{variableName}` syntax:

```typescript
// Message: "Order #{orderId} has been completed"
// Variables: { orderId: "12345" }
// Result: "Order #12345 has been completed"
```## Serv
ice Usage

### Basic Usage

```typescript
import { NotificationsService } from '@common/notifications/notifications.service';

@Injectable()
export class YourService {
  constructor(private notificationsService: NotificationsService) {}

  // Send to organization with message key
  async sendOrderNotification(organizationId: string, orderData: any) {
    await this.notificationsService.sendWooCommerceNotification(
      organizationId,
      'order.completed',
      orderData,
      {
        data: { type: 'order_update' },
        url: `https://your-app.com/orders/${orderData.id}`
      }
    );
  }

  // Send to specific users
  async sendMaintenanceNotification(userIds: string[]) {
    await this.notificationsService.sendToUsers(
      userIds,
      'system.maintenance',
      { date: '2024-01-15 02:00 AM' },
      {
        data: { type: 'system_notification', priority: 'high' }
      }
    );
  }
}
```

### WooCommerce Integration

```typescript
// In your WooCommerce webhook handler
@Post('webhooks/order/updated')
async handleOrderUpdated(@Request() req, @Headers() headers) {
  // Validate webhook signature
  const isValid = this.wooCommerceService.validateWebhookSignature(
    req.rawBody,
    headers['x-wc-webhook-signature'],
    webhookSecret
  );

  if (!isValid) {
    throw new UnauthorizedException('Invalid webhook signature');
  }

  const orderData = req.body;
  const organizationId = 'your-org-id'; // Get from webhook context

  // Send localized notification automatically
  await this.notificationsService.sendWooCommerceNotification(
    organizationId,
    'order.updated',
    orderData,
    {
      data: {
        type: 'woocommerce_webhook',
        action: 'order_updated'
      },
      url: `https://your-app.com/orders/${orderData.id}`
    }
  );

  return { success: true };
}
```

### Updating User Settings

```typescript
import { NotificationsService } from '@common/notifications/notifications.service';

@Injectable()
export class UserService {
  constructor(private notificationsService: NotificationsService) {}

  async updateUserNotificationSettings(userId: string, signalId?: string, language?: string) {
    if (signalId) {
      await this.notificationsService.updateUserSignalId(userId, signalId);
    }
    
    if (language) {
      await this.notificationsService.updateUserLanguage(userId, language);
    }
  }
}
```

## Frontend Integration

### 1. OneSignal SDK Setup

```bash
npm install react-onesignal
```

### 2. Initialize OneSignal

```typescript
import OneSignal from 'react-onesignal';

// Initialize OneSignal
await OneSignal.init({
  appId: 'your-onesignal-app-id',
  allowLocalhostAsSecureOrigin: true, // for development
});

// Get player ID
const playerId = await OneSignal.getPlayerId();

// Send player ID to your backend
await fetch('/auth/update-signal-id', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ signalId: playerId })
});
```

### 3. Handle Notifications

```typescript
// Listen for notification clicks
OneSignal.on('notificationClick', (event) => {
  const { data, url } = event.notification;
  
  if (data.messageKey === 'order.updated') {
    // Navigate to order page
    window.location.href = url || `/orders/${data.webhookId}`;
  }
});
```

## Adding New Messages

### 1. Add to Message Files

```typescript
// In src/common/notifications/messages/woocommerce.messages.ts
export const WOOCOMMERCE_MESSAGES: NotificationTemplate = {
  // ... existing messages
  
  'order.shipped': {
    en: {
      content: 'Order #{orderId} has been shipped',
      heading: 'Order Shipped',
    },
    fa: {
      content: 'سفارش شماره {orderId} ارسال شد',
      heading: 'ارسال سفارش',
    },
    ar: {
      content: 'تم شحن الطلب رقم {orderId}',
      heading: 'تم الشحن',
    },
  },
};
```

### 2. Use the New Message

```typescript
await this.notificationsService.sendWooCommerceNotification(
  organizationId,
  'order.shipped',
  orderData,
  {
    data: { type: 'shipping_update' },
    url: `https://your-app.com/orders/${orderData.id}/tracking`
  }
);
```

## Best Practices

1. **Use message keys** instead of hardcoded text for consistency
2. **Handle notification failures gracefully** - don't break main business logic
3. **Test with multiple languages** to ensure proper localization
4. **Use meaningful data payloads** for rich frontend handling
5. **Validate webhook signatures** before processing
6. **Log notification attempts** for debugging

## Troubleshooting

### Common Issues

1. **Notifications not received**: Check if users have valid `signalId`
2. **Wrong language**: Verify user's `language` field is set correctly
3. **Message not found**: Ensure message key exists in message directory
4. **OneSignal API errors**: Check API key and app ID configuration

### Debug Logging

```typescript
// Enable debug logging
this.logger.debug('Sending notification', { 
  messageKey, 
  organizationId, 
  userCount: users.length 
});
```

Check application logs for detailed error messages and OneSignal API responses.