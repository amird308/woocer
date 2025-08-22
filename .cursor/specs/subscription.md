# AI Credit Purchase System Implementation

## 🎯 Project Overview
Implement a dual-credit system for our WooCommerce store management app where users can purchase additional AI credits that never expire, alongside their monthly subscription credits.

## 📋 Requirements Summary

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


### Business Logic
- Only AI plan subscribers can purchase credits
- Pro plan users get 0 credits (blocked from AI features)
- Credits never expire once purchased
- Monthly credits reset on subscription renewal

### Error Handling
- Handle insufficient credits gracefully
- Retry failed webhook deliveries
- Validate purchase authenticity
- Handle refund scenarios

### Security
- Verify all webhook signatures
- Validate user permissions
- Sanitize credit purchase requests
- Audit credit usage patterns

### Cross-Platform
- [ ] Web credit purchases work
- [ ] iOS credit purchases work
- [ ] Android credit purchases work
- [ ] Consistent experience across platforms
