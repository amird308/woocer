export interface EmployeeSubscriptionEntity {
  id: string;
  subscriptionId: string;
  userId: string;
  organizationId: string;
  isActive: boolean;
  assignedAt: Date;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
