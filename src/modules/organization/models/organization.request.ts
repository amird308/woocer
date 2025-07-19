import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';
import { OrganizationEntity } from '../../../common/entities';

export class CreateOrganizationDto implements Pick<OrganizationEntity, 'name' | 'companyName' | 'companyEmail' | 'companyWebsite'> {
  @ApiProperty({ description: 'Organization name', example: 'Acme Corp' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Company name', example: 'Acme Corporation', required: false })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ description: 'Company email', example: 'contact@acme.com', required: false })
  @IsOptional()
  @IsString()
  companyEmail?: string;

  @ApiProperty({ description: 'Company website', example: 'https://acme.com', required: false })
  @IsOptional()
  @IsUrl()
  companyWebsite?: string;
}

export class UpdateOrganizationDto implements Partial<Pick<OrganizationEntity, 'name' | 'companyName' | 'companyAddress' | 'companyPhone' | 'companyEmail' | 'companyWebsite' | 'companyDescription'>> {
  @ApiProperty({ description: 'Organization name', example: 'Acme Corp', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Company name', example: 'Acme Corporation', required: false })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ description: 'Company address', required: false })
  @IsOptional()
  @IsString()
  companyAddress?: string;

  @ApiProperty({ description: 'Company phone', required: false })
  @IsOptional()
  @IsString()
  companyPhone?: string;

  @ApiProperty({ description: 'Company email', required: false })
  @IsOptional()
  @IsString()
  companyEmail?: string;

  @ApiProperty({ description: 'Company website', required: false })
  @IsOptional()
  @IsUrl()
  companyWebsite?: string;

  @ApiProperty({ description: 'Company description', required: false })
  @IsOptional()
  @IsString()
  companyDescription?: string;
}