export interface SessionEntity {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  activeOrganizationId?: string;
  createdAt: Date;
  updatedAt: Date;
}