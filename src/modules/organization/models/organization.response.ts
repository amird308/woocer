import { ApiProperty } from '@nestjs/swagger';
import { OrganizationEntity } from '../../../common/entities';

export class OrganizationResponseDto implements OrganizationEntity {
  @ApiProperty({ description: 'Organization ID', example: 'uuid-string' })
  id: string;

  @ApiProperty({ description: 'Organization name', example: 'Acme Corp' })
  name: string;

  @ApiProperty({ description: 'Organization slug', example: 'acme-corp' })
  slug: string;

  @ApiProperty({ description: 'Organization logo URL', required: false })
  logo?: string;

  @ApiProperty({ description: 'Organization metadata', required: false })
  metadata?: any;

  @ApiProperty({ description: 'Organization creation date', example: '2024-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Company name', required: false })
  companyName?: string;

  @ApiProperty({ description: 'Company address', required: false })
  companyAddress?: string;

  @ApiProperty({ description: 'Company phone', required: false })
  companyPhone?: string;

  @ApiProperty({ description: 'Company email', required: false })
  companyEmail?: string;

  @ApiProperty({ description: 'Company website', required: false })
  companyWebsite?: string;

  @ApiProperty({ description: 'Company description', required: false })
  companyDescription?: string;

  @ApiProperty({ description: 'Company logo file key', required: false })
  companyLogoFileKey?: string;

  @ApiProperty({ description: 'Company banner file key', required: false })
  companyBannerFileKey?: string;

  @ApiProperty({ description: 'Company theme', required: false })
  companyTheme?: string;

  @ApiProperty({ description: 'Domain profile', required: false })
  domainProfile?: string;
}

export class OrganizationSummaryDto implements Pick<OrganizationEntity, 'id' | 'name' | 'slug' | 'logo'> {
  @ApiProperty({ description: 'Organization ID', example: 'uuid-string' })
  id: string;

  @ApiProperty({ description: 'Organization name', example: 'Acme Corp' })
  name: string;

  @ApiProperty({ description: 'Organization slug', example: 'acme-corp' })
  slug: string;

  @ApiProperty({ description: 'Organization logo URL', required: false })
  logo?: string;
}