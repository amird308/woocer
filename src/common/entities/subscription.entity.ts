export interface SubscriptionEntity {
  id: string;
  userId: string;
  revenueCatCustomerId?: string; // Nullable for trial subscriptions
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billingPeriod: number; // 1, 6, or 12 months (14 days for trial)
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  totalCredits: number; // Total credits allocated for billing period
  usedCredits: number; // Credits used in current period
  purchasedCredits: number; // Additional purchased credits (never expire)
  isActive: boolean;
  // Employee subscription fields
  isEmployeeSubscription: boolean;
  sponsorOrganizationId?: string;
  maxEmployees?: number;
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
