export interface OrganizationEntity {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  metadata?: any;
  createdAt: Date;
  
  // Company details
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  companyDescription?: string;
  companyLogoFileKey?: string;
  companyBannerFileKey?: string;
  companyTheme?: string;
  
  domainProfile?: string;
}