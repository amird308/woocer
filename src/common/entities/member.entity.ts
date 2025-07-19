export interface MemberEntity {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  teamId?: string;
  createdAt: Date;
}