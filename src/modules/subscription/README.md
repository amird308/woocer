# Subscription Module

This module implements a dual-credit system for the WooCommerce store management app where users can purchase additional AI credits that never expire, alongside their monthly subscription credits.

## Features

### Core Features
- **Two Credit Types**: Monthly subscription credits (reset monthly) + Purchased credits (never expire)
- **Smart Usage Priority**: Use monthly credits first, then purchased credits
- **Tiered Pricing**: Volume discounts for larger credit packages
- **Cross-Platform**: Web (RevenueCat Web SDK), iOS, Android (RevenueCat SDK)
- **Single Source of Truth**: RevenueCat handles all payments and webhooks

### Business Rules
- Only **AI Plan** subscribers can purchase and use credits
- **Pro Plan** subscribers get 0 AI credits (no access to AI features)
- Monthly credits reset every month, purchased credits never expire
- Credits are consumed in order: Monthly → Purchased

## API Endpoints

### Subscriptions
- `POST /subscriptions` - Create subscription
- `GET /subscriptions/current` - Get current user subscription with credit details
- `GET /subscriptions/:id` - Get subscription by ID
- `PUT /subscriptions/:id` - Update subscription
- `POST /subscriptions/consume-credits` - Consume credits
- `POST /subscriptions/:id/reset-monthly-credits` - Reset monthly credits (admin)

### Credit Packages
- `GET /credit-packages` - Get active credit packages with tiered pricing
- `GET /credit-packages/all` - Get all packages (admin)
- `GET /credit-packages/:id` - Get package by ID

**Note**: Credit packages are created and managed directly in the RevenueCat dashboard. The API only provides read access to existing packages.

### Credit Purchases
- `GET /credit-purchases/pricing` - Get tiered pricing with recommendations
- `POST /credit-purchases/validate` - Validate purchase eligibility
- `POST /credit-purchases/initiate` - Initiate purchase (prepare for RevenueCat)
- `GET /credit-purchases/history` - Get purchase history
- `POST /credit-purchases/:id/cancel` - Cancel pending purchase
- `GET /credit-purchases/analytics` - Get purchase analytics (admin)

#### Credit Purchase Flow
1. **Get Pricing**: Client fetches available credit packages with tiered pricing
2. **Validate**: Client validates user eligibility for selected package
3. **Initiate**: Client initiates purchase and receives purchase token
4. **RevenueCat**: Client uses RevenueCat SDK to complete payment
5. **Webhook**: RevenueCat webhook triggers credit addition to user account

### Webhooks
- `POST /webhooks/revenuecat` - Handle RevenueCat webhook events
- `POST /webhooks/test` - Test webhook endpoint (development only)

## Guards

### AI Plan Guard
Use `@RequireAIPlan()` decorator to restrict routes to AI plan subscribers only.

```typescript
@Get('ai-feature')
@RequireAIPlan()
async useAIFeature() {
  // Only AI plan subscribers can access this
}
```

### Credit Available Guard
Use `@RequireCredits(amount)` decorator to ensure users have sufficient credits.

```typescript
@Post('generate')
@RequireCredits(5)
async generateContent() {
  // Requires 5 credits to access
}
```

## Usage Examples

### Consuming Credits
```typescript
// In a controller
@Post('ai-action')
@RequireCredits(1)
async performAIAction(@CurrentUser() user: UserEntity) {
  // Use subscription service to consume credits
  await this.subscriptionService.consumeCredits(
    user.id,
    organizationId,
    {
      credits: 1,
      description: 'AI content generation',
      metadata: { action: 'generate_content' }
    }
  );
  
  // Perform AI action...
}
```

### Checking Subscription Status
```typescript
const subscription = await this.subscriptionService.getSubscriptionByUserAndOrganization(
  userId,
  organizationId
);

if (subscription?.canUseAIFeatures) {
  // User can use AI features
  console.log(`Available credits: ${subscription.availableCredits}`);
}
```

### Credit Purchase Flow
```typescript
// 1. Get tiered pricing
const pricing = await this.creditPurchaseService.getTieredPricing();
console.log(`Recommended package: ${pricing.recommendedPackageId}`);

// 2. Validate purchase
const validation = await this.creditPurchaseService.validatePurchase(
  userId,
  organizationId,
  packageId
);

if (validation.canPurchase) {
  // 3. Initiate purchase
  const purchase = await this.creditPurchaseService.initiatePurchase(
    userId,
    organizationId,
    { creditPackageId: packageId }
  );
  
  // 4. Use purchase token with RevenueCat SDK
  // Client-side: RevenueCat.purchaseProduct(productId, purchaseToken)
}
```

## Database Schema

The module adds the following tables:
- `Subscription` - User subscriptions with credit tracking
- `CreditPackage` - Available credit packages (synced from RevenueCat)
- `CreditPurchase` - Record of credit purchases
- `CreditTransaction` - Audit trail of credit usage

**Note**: Credit packages are created in RevenueCat dashboard and synced to the database via webhooks.

## RevenueCat Integration

The module integrates with RevenueCat for payment processing:

1. **Webhook Events**: Handles subscription events (purchase, renewal, cancellation)
2. **Credit Purchases**: Processes non-renewing purchases for credits
3. **Security**: Validates webhook signatures for security

### Supported Webhook Events
- `INITIAL_PURCHASE` - New subscription
- `RENEWAL` - Subscription renewal (resets monthly credits)
- `CANCELLATION` - Subscription cancelled
- `UNCANCELLATION` - Subscription reactivated
- `NON_RENEWING_PURCHASE` - Credit purchase
- `EXPIRATION` - Subscription expired
- `BILLING_ISSUE` - Payment failed

## Environment Variables

Required environment variables:
```env
REVENUECAT_WEBHOOK_SECRET=your_webhook_secret
DATABASE_URL=your_database_url
```

## Testing

The module includes test endpoints for development:
- Test webhook endpoint at `/webhooks/test` (development only)
- Comprehensive validation and error handling
- Audit trails for all credit transactions

## Security

- Webhook signature verification
- User permission validation
- Credit consumption audit trails
- Secure purchase token generation
- Rate limiting and abuse prevention

