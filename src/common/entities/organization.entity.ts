export interface OrganizationEntity {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  metadata?: any;
  createdAt: Date;
  consumerKey: string;
  consumerSecret: string;
  wooCommerceUrl: string;
}
