export interface CreditPurchaseEntity {
  id: string;
  userId: string;
  organizationId: string;
  subscriptionId: string;
  creditPackageId: string;
  revenueCatTransactionId: string;
  credits: number;
  price: number;
  currency: string;
  status: PurchaseStatus;
  purchasedAt: Date;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum PurchaseStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}
