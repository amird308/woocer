# Store Subscription System Guide

## Overview

Our platform provides a flexible subscription system that allows users to create stores (organizations) and manage subscriptions for themselves and their team members. The system supports two subscription models: personal subscriptions and employee subscriptions.

## Core Concepts

### 1. Stores (Organizations)
- **Store Creation**: Users can create stores
- **Member Management**: Store admins can add and remove team members
- **Subscription Management**: Store admins can purchase and assign subscriptions to team members

### 2. Subscription Plans

#### Trial Plan (Free)
- **Duration**: 14 days free trial
- **Credits**: 50 AI credits (one-time allocation)
- **Features**: Full access to AI features during trial period
- **Purpose**: Allow users to test AI capabilities before committing to paid plans
- **Limitations**: Cannot purchase additional credits during trial
- **Conversion**: Automatically converts to selected paid plan after trial ends

#### Pro Plan
- Access to core platform features
- Store management capabilities
- Team collaboration tools
- **Credits**: 0 AI credits (no AI features)
- **Available Periods**: 1, 6, or 12 months

#### AI Plan
- **Everything in Pro Plan** +
- AI-powered features and tools
- **Credits**: 100 monthly AI credits (resets every month)
- Ability to purchase additional credits that never expire
- **Available Periods**: 1, 6, or 12 months

### 3. Billing Periods

Our platform supports flexible billing periods to accommodate different business needs:

#### Trial Period (Free)
- **Duration**: 14 days from signup
- **Credits**: 50 AI credits (one-time allocation, no reset)
- **Cost**: Completely free
- **Best For**: New users wanting to test AI features
- **Conversion**: Requires plan selection before trial expires

#### 1 Month Subscription
- **Billing**: Monthly recurring payments
- **Credits**: 100 AI credits allocated monthly (for AI plans)
- **Best For**: Small teams or trial periods
- **Flexibility**: Easy to upgrade/downgrade or cancel

#### 6 Month Subscription
- **Billing**: Charged every 6 months
- **Credits**: 600 AI credits allocated upfront (100 × 6 months for AI plans)
- **Discount**: Typically includes pricing discount vs monthly billing
- **Best For**: Growing teams with medium-term commitment

#### 12 Month Subscription
- **Billing**: Annual payment
- **Credits**: 1,200 AI credits allocated upfront (100 × 12 months for AI plans)
- **Discount**: Best pricing with maximum discount vs monthly billing
- **Best For**: Established teams with long-term commitment

#### Credit Allocation by Period
- **Trial Plans**: 50 AI credits allocated once (no reset, expires after 14 days)
- **Monthly Plans**: Credits reset every month
- **6-Month Plans**: Full 6-month credit allocation provided upfront, no monthly reset
- **Annual Plans**: Full 12-month credit allocation provided upfront, no monthly reset

**Note**: For longer billing periods, if you cancel mid-term, unused credits remain available until the end of the paid period. Trial credits expire after 14 days regardless of usage.

### 4. Subscription Models

#### Personal Subscriptions
- Individual users subscribe for their own use
- Credits are tied to the user's personal account
- Can be used across any organization the user belongs to

#### Employee Subscriptions
- Store admins purchase subscriptions for their team members
- Credits are tied to the organization
- Employees use organization-provided subscription benefits

## Subscription Workflows

### Personal Trial Workflow

#### Step 1: Trial Signup
1. **Create Account**: New user signs up for the platform
2. **Start Trial**: Automatically receives 14-day trial with 50 AI credits
3. **Explore Features**: User can test all AI features during trial period
4. **Choose Plan**: Before trial expires, user selects Pro or AI plan for continuation

### Employee Subscription Workflow

#### Step 1: Store Setup
1. **Create Store**: User creates a new organization/store
2. **Add Members**: Store admin invites team members to join the organization
3. **Member Acceptance**: Invited users accept the invitation and become organization members

#### Step 2: Subscription Purchase
1. **Choose Plan**: Store admin selects Trial, Pro, or AI plan for employees
2. **Select Billing Period**: Admin chooses billing cycle (Trial: 14 days, Paid: 1, 6, or 12 months)
3. **Bulk Purchase**: Admin creates a bulk employee subscription that covers multiple employees
4. **Set Parameters**:
   - Subscription plan type (Trial, Pro, or AI)
   - Billing period (14 days for trial, 1/6/12 months for paid plans)
   - Number of employee slots
   - Discount percentage (if applicable)
   - Credit allocation (50 for trial, varies for AI plans)

### Step 3: Employee Assignment
1. **Select Employees**: Admin chooses which team members to assign to the subscription
2. **Assign Access**: System creates employee subscription records linking users to the subscription
3. **Activate Benefits**: Employees immediately gain access to subscription features

### Step 4: Usage and Management
1. **Credit Consumption**: Employees can consume credits from the organization's subscription
2. **Usage Monitoring**: Admins can track credit usage and employee activity
3. **Subscription Management**: Admins can add/remove employees or upgrade/downgrade plans

## API Endpoints

### Organization Management
```http
POST /organizations                    # Create new store/organization
GET /organizations/:id/members         # Get organization members
POST /organizations/:id/invitations    # Invite members to organization
```

### Employee Subscriptions
```http
# Bulk Subscription Management
POST /organizations/:organizationId/employee-subscriptions
# Create bulk employee subscription for organization

GET /employee-subscriptions/:subscriptionId
# Get employee subscription details with credit information

# Employee Assignment
POST /employee-subscriptions/:subscriptionId/assign
# Assign specific employee to subscription

DELETE /employee-subscriptions/:subscriptionId/revoke/:userId/organizations/:organizationId
# Remove employee from subscription

# Credit Management
POST /employee-subscriptions/:subscriptionId/consume-credits
# Consume credits from employee subscription

GET /employee-subscriptions/usage-report/:organizationId
# Get usage analytics for organization
```

### Personal Subscriptions
```http
POST /subscriptions                    # Create personal subscription
GET /subscriptions/current             # Get current user's subscription (includes trial)
POST /subscriptions/consume-credits    # Consume credits from personal subscription
GET /subscriptions/trial               # Get trial subscription status
POST /subscriptions/trial/convert      # Convert trial to paid subscription
```

## Credit System

### Credit Types

#### Trial Credits
- **Trial Plans**: 50 AI credits allocated once at trial start
- **Expiration**: Credits expire after 14 days regardless of usage
- **No Reset**: One-time allocation, no monthly reset
- **Usage Priority**: Used first (trial credits cannot coexist with other credit types)

#### Monthly Credits
- **1-Month Plans**: 100 credits allocated monthly, reset on renewal
- **6-Month Plans**: 600 credits allocated upfront (100 × 6 months)
- **12-Month Plans**: 1,200 credits allocated upfront (100 × 12 months)
- **Pro Plan**: 0 credits regardless of billing period
- **Usage Priority**: Used first before purchased credits

#### Purchased Credits
- **Expiration**: Never expire
- **Availability**: Only for AI plan subscribers
- **Usage Priority**: Used after monthly credits are exhausted
- **Transferability**: Cannot be transferred between users

### Credit Consumption Priority
1. **Trial Credits**: Used during trial period (expire after 14 days)
2. **Monthly Credits**: Used first for paid plans (reset monthly)
3. **Purchased Credits**: Used when monthly credits are exhausted

### Credit Consumption Flow
```typescript
// Employee consuming credits from organization subscription
POST /employee-subscriptions/:subscriptionId/consume-credits
{
  "userId": "employee-user-id",
  "organizationId": "organization-id",
  "credits": 5,
  "description": "AI content generation",
  "metadata": { "feature": "product_description" }
}

// Personal subscription credit consumption
POST /subscriptions/consume-credits
{
  "credits": 3,
  "description": "Personal AI assistance",
  "metadata": { "action": "content_optimization" }
}
```

## Permission System

### Organization Roles
- **Owner**: Full administrative access, can manage subscriptions and members
- **Admin**: Can manage members but limited subscription access
- **Member**: Can use assigned subscription benefits, no administrative access

### Required Permissions
- **Create Employee Subscription**: `organization:owner`
- **Assign Employees**: `organization:owner`
- **Revoke Employee Access**: `organization:owner`
- **View Usage Reports**: `organization:owner` or `organization:admin`

## Business Rules

### Subscription Eligibility
- **Trial Plan** users get full AI access with 50 credits for 14 days
- Only **AI Plan** paid subscribers can purchase additional credits
- **Pro Plan** subscribers have access to core features but no AI capabilities
- Personal and employee subscriptions are separate and don't interfere with each other
- All billing periods (1, 6, 12 months) are available for both Pro and AI plans
- Trial plans are limited to 14 days and cannot be extended

### Employee Subscription Rules
- Admins can only assign subscriptions to confirmed organization members
- Each employee can have only one active assignment per organization
- Subscription benefits are organization-scoped
- Revoking employee access immediately stops their ability to use subscription features

### Trial Plan Rules
- Trial period starts immediately upon account creation
- 50 AI credits are allocated once at trial start
- Trial cannot be paused, extended, or restarted
- Users must choose a paid plan before trial expires to continue service
- Trial credits expire after 14 days regardless of usage
- Cannot purchase additional credits during trial period

### Credit Usage Rules
- Credits can only be consumed by active subscription holders (including trial users)
- AI features require active AI plan or trial subscription
- Credit transactions are logged for audit purposes
- Insufficient credits block AI feature access
- Trial users have full AI feature access within their 50-credit limit

## Integration with RevenueCat

### Payment Processing
- All subscription payments are processed through RevenueCat
- Webhook integration handles subscription lifecycle events
- Automatic credit allocation and renewal management

### Supported Events
- `INITIAL_PURCHASE`: New subscription creation
- `RENEWAL`: Monthly credit reset and subscription continuation
- `CANCELLATION`: Subscription termination
- `NON_RENEWING_PURCHASE`: Additional credit purchases

## Usage Examples

### Complete Employee Subscription Flow

#### 1. User Trial Experience
```typescript
// New user signup automatically gets trial
const user = await createAccount({
  email: "user@example.com",
  name: "John Doe"
});

// Trial subscription is automatically created
const trialSubscription = await getTrialSubscription(user.id);
console.log(`Trial credits: ${trialSubscription.availableCredits}`); // 50
console.log(`Trial expires: ${trialSubscription.expiresAt}`); // 14 days from signup
```

#### 2. Create Organization and Add Members
```typescript
// Create store/organization
const organization = await createOrganization({
  name: "My Coffee Shop",
  description: "Coffee shop management"
});

// Invite team members
await inviteMember({
  organizationId: organization.id,
  email: "barista@coffeeshop.com",
  role: "MEMBER"
});
```

#### 3. Purchase Employee Subscription
```typescript
// Create bulk employee subscription with 6-month billing
const subscription = await createBulkEmployeeSubscription({
  plan: "AI",
  billingPeriod: 6, // 1, 6, or 12 months
  employeeUserIds: ["user-1", "user-2", "user-3"],
  organizationId: organization.id,
  discountPercentage: 20,
  totalCredits: 600 // 100 credits × 6 months upfront
});
```

#### 4. Employee Uses AI Features
```typescript
// Employee consuming credits for AI features
const result = await consumeEmployeeCredits({
  subscriptionId: subscription.id,
  userId: "user-1",
  organizationId: organization.id,
  credits: 5,
  description: "Generate product descriptions"
});

console.log(`Credits used: ${result.creditsConsumed}`);
console.log(`Remaining credits: ${result.remainingCredits}`);
```

#### 5. Monitor Usage
```typescript
// Admin checking usage report
const report = await getUsageReport(organization.id);
console.log(`Total credits used this month: ${report.totalCreditsUsed}`);
console.log(`Active employees: ${report.activeEmployees}`);
```

## Security and Compliance

### Data Protection
- All subscription data is encrypted at rest
- Payment information is handled exclusively by RevenueCat
- User data access is strictly permission-based

### Audit Trail
- All credit transactions are logged
- Employee assignment/revocation events are tracked
- Administrative actions are recorded with timestamps

### Access Control
- Organization-scoped permissions prevent cross-organization access
- Employee subscriptions are isolated per organization
- Authentication required for all subscription operations

## Error Handling

### Common Error Scenarios
- **Insufficient Credits**: User attempts to consume more credits than available
- **Invalid Permissions**: Non-owner tries to manage employee subscriptions
- **Subscription Not Found**: Invalid subscription ID provided
- **Employee Not Member**: Attempting to assign subscription to non-member
- **Maximum Employees Reached**: Subscription employee limit exceeded

### Error Response Format
```json
{
  "statusCode": 400,
  "message": "Insufficient credits",
  "error": "Bad Request",
  "details": {
    "availableCredits": 5,
    "requestedCredits": 10
  }
}
```

## Best Practices

### For Store Admins
1. **Start with Trial**: Encourage new team members to use 14-day trial first
2. **Plan Ahead**: Consider team size when purchasing employee subscriptions
3. **Choose Billing Period Wisely**:
   - **Trial**: Perfect for testing AI features before committing
   - **1 Month**: Best for small teams or uncertain usage patterns
   - **6 Months**: Good balance of savings and flexibility for growing teams
   - **12 Months**: Maximum savings for stable, long-term teams
4. **Monitor Usage**: Regularly check credit consumption reports
5. **Manage Access**: Promptly revoke access for former employees
6. **Choose Right Plan**: Select AI plan only if team needs AI features
7. **Consider Team Stability**: Longer billing periods offer better pricing but require commitment
8. **Trial to Paid Conversion**: Set up paid plans before trial periods expire

### For Developers
1. **Handle Errors Gracefully**: Always check subscription status before AI operations
2. **Validate Permissions**: Ensure proper organization membership before operations
3. **Monitor Credits**: Check available credits before expensive operations
4. **Use Audit Logs**: Implement proper logging for all credit transactions

## Support and Troubleshooting

### Common Issues
- **Trial Not Starting**: Check if user account was created successfully
- **Trial Expired**: User needs to select paid plan to continue AI features
- **Credits Not Appearing**: Check subscription status and organization membership
- **Cannot Assign Employee**: Verify user is confirmed organization member
- **AI Features Blocked**: Ensure user has active AI plan or trial subscription
- **Permission Denied**: Confirm user has appropriate organization role
- **Trial Credits Exhausted**: User must either purchase credits or upgrade to paid plan

### Getting Help
- Check API documentation for endpoint details
- Review error messages for specific guidance
- Contact support with subscription ID and organization details
- Use test endpoints in development environment for debugging

---

This subscription system provides flexible, scalable solutions for teams of any size while maintaining security and providing detailed usage insights for optimal resource management.
