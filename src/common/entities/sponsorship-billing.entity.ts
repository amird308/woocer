export interface SponsorshipBillingEntity {
  id: string;
  sponsorshipId: string; // Links to the sponsorship being billed
  sponsorUserId: string; // Who is being charged
  billingPeriodStart: Date; // Start of billing period
  billingPeriodEnd: Date; // End of billing period
  amount: number; // Final amount charged (after discount applied)
  originalAmount?: number; // Original amount before discount
  discountAmount?: number; // Amount saved due to discount
  status: string; // pending, paid, failed, refunded
  revenueCatTransactionId?: string; // RevenueCat transaction reference
  createdAt: Date;
  updatedAt: Date;
}
