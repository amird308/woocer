export interface CreditTransactionEntity {
  id: string;
  userId: string;
  organizationId: string;
  subscriptionId?: string;
  type: CreditTransactionType;
  amount: number;
  description: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export enum CreditTransactionType {
  TRIAL_ALLOCATION = 'TRIAL_ALLOCATION',
  PERIOD_ALLOCATION = 'PERIOD_ALLOCATION',
  PURCHASED = 'PURCHASED',
  CONSUMED = 'CONSUMED',
  REFUNDED = 'REFUNDED',
  EXPIRED = 'EXPIRED',
}
