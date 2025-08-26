import { SubscriptionPlan } from './subscription.entity';

export interface EmployeeSubscriptionSponsorshipEntity {
  id: string;
  subscriptionId: string; // One-to-one relationship with the sponsored subscription
  sponsorUserId: string; // Organization owner who pays for the subscription
  sponsoredUserId: string; // Employee who receives the sponsored subscription
  organizationId: string; // Organization context for this sponsorship
  plan: SubscriptionPlan; // The plan being sponsored (PRO or AI)
  monthlyCost: number; // Cost per month for this sponsorship (consider applying DISCOUNT env variable)
  discountApplied?: number; // Percentage discount applied (e.g., 0.15 for 15% off)
  originalPrice: number; // Original price before discount
  isActive: boolean; // Whether sponsorship is currently active
  sponsoredAt: Date; // When sponsorship started
  cancelledAt?: Date; // When sponsorship was cancelled (if applicable)
  createdAt: Date;
  updatedAt: Date;
}
