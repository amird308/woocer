# WooCommerce Integration Guide

## Overview

The WooCommerce integration automatically creates webhooks for your WooCommerce store and synchronizes orders and products when an organization is created with WooCommerce credentials.

## Setup Process

### 1. Organization Creation

When creating an organization, provide the following WooCommerce credentials:

- **wooCommerceUrl**: Your WooCommerce store URL (e.g., `https://yourstore.com`)
- **consumerKey**: WooCommerce REST API Consumer Key  
- **consumerSecret**: WooCommerce REST API Consumer Secret

### 2. Automatic Webhook Creation

Upon organization creation, the system automatically:

- Creates webhooks for order events (created, updated)
- Creates webhooks for product events (created, updated)
- Sets up webhook endpoints at:
  - `POST /api/woocommerce/webhooks/order/created`
  - `POST /api/woocommerce/webhooks/order/updated`
  - `POST /api/woocommerce/webhooks/product/created`
  - `POST /api/woocommerce/webhooks/product/updated`

### 3. Initial Data Sync

The system automatically synchronizes:

- All existing orders from your WooCommerce store
- All existing products from your WooCommerce store

## Manual Operations

### Setup Integration

Manually trigger WooCommerce integration setup:

```http
POST /api/woocommerce/setup/{organizationId}
Authorization: Bearer {token}
```

### Sync Orders

Manually sync orders from WooCommerce:

```http
POST /api/woocommerce/sync/orders/{organizationId}
Authorization: Bearer {token}
```

### Sync Products

Manually sync products from WooCommerce:

```http
POST /api/woocommerce/sync/products/{organizationId}
Authorization: Bearer {token}
```

## Database Models

### WooCommerceOrder

Stores order information including:
- Customer details (billing/shipping)
- Order totals and taxes
- Payment information
- Order items

### WooCommerceOrderItem

Stores individual line items for each order:
- Product information
- Quantities and pricing
- Tax details

### WooCommerceProduct

Stores product catalog information:
- Product details and descriptions
- Pricing and inventory
- Images and categories
- Variations and attributes

### WooCommerceWebhook

Tracks webhook configurations:
- Webhook IDs and endpoints
- Topics and secrets
- Status and timestamps

## Security

- Webhook signatures are validated using HMAC-SHA256
- All API endpoints require authentication
- Store management permissions are required for manual operations

## Environment Variables

Ensure the following environment variable is set:

```env
APP_URL=https://your-api-domain.com
```

This is used for webhook delivery URLs.

## Error Handling

- Webhook processing failures are logged but don't affect store operations
- Invalid webhook signatures are rejected
- Missing organization configurations are handled gracefully

## Monitoring

Monitor webhook processing through application logs:

- Successful webhook processing
- Signature validation failures
- Organization setup status
- Sync operation results 