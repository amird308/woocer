export interface SubscriptionEntity {
  id: string;
  userId: string;
  organizationId: string;
  revenueCatCustomerId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  monthlyCredits: number;
  usedMonthlyCredits: number;
  purchasedCredits: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum SubscriptionPlan {
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
