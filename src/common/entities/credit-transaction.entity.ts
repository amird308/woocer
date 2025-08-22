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
  MONTHLY_ALLOCATION = 'MONTHLY_ALLOCATION',
  PURCHASED = 'PURCHASED',
  CONSUMED = 'CONSUMED',
  REFUNDED = 'REFUNDED',
  EXPIRED = 'EXPIRED',
}
