export interface CreditPackageEntity {
  id: string;
  name: string;
  credits: number;
  price: number;
  currency: string;
  revenueCatProductId: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
