export interface UserSecretEntity {
  id: string;
  userId: string;
  organizationId: string;
  publicKey: string;
  encryptedData: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationSecretsData {
  consumerKey: string;
  consumerSecret: string;
  wooCommerceUrl: string;
}
