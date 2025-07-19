export interface InvitationEntity {
  id: string;
  email: string;
  inviterId: string;
  organizationId: string;
  role: string;
  teamId?: string;
  status: string;
  expiresAt: Date;
  createdAt: Date;
}