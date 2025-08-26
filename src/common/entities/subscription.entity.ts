export interface SubscriptionEntity {
  id: string;
  userId: string; // The user who owns this subscription
  revenueCatCustomerId?: string; // RevenueCat customer ID (nullable for trial subscriptions)
  plan: SubscriptionPlan; // TRIAL, PRO, or AI
  status: SubscriptionStatus; // ACTIVE, TRIALING, CANCELED, etc.
  billingPeriod: number; // 1, 6, or 12 months (14 days for trial)
  currentPeriodStart: Date; // When current billing period started
  currentPeriodEnd: Date; // When current billing period ends
  totalCredits: number; // Total credits allocated for current billing period
  usedCredits: number; // Credits consumed in current period
  purchasedCredits: number; // Additional purchased credits (never expire)
  isActive: boolean; // Whether subscription is currently active
  createdAt: Date;
  updatedAt: Date;
}

export enum SubscriptionPlan {
  TRIAL = 'TRIAL',
  PRO = 'PRO',
  AI = 'AI',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  TRIALING = 'TRIALING',
  PAST_DUE = 'PAST_DUE',
  CANCELED = 'CANCELED',
  UNPAID = 'UNPAID',
  PAUSED = 'PAUSED',
}
