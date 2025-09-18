import { IsString, IsOptional, IsUrl, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EncryptedData {
  @ApiProperty({
    description: 'Encrypted data',
    example: 'encrypted_data',
  })
  @IsString()
  @IsNotEmpty()
  encryptedData: string;

  @ApiProperty({
    description: 'Encrypted symmetric key',
    example: 'encrypted_symmetric_key',
  })
  @IsString()
  @IsNotEmpty()
  encryptedSymmetricKey: string;
}

export class CreateOrganizationRequestDto {
  @ApiProperty({
    description: 'Organization name',
    example: 'My Store',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Organization slug (auto-generated if not provided)',
    example: 'my-store',
  })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({
    description: 'Organization logo URL',
    example: 'https://example.com/logo.png',
  })
  @IsUrl()
  @IsOptional()
  logo?: string;

  @ApiProperty({
    description:
      'WooCommerce consumer key (plain text - will be encrypted server-side)',
    example: 'ck_secret123',
  })
  @IsString()
  @IsNotEmpty()
  consumerKey: string;

  @ApiProperty({
    description:
      'WooCommerce consumer secret (plain text - will be encrypted server-side)',
    example: 'cs_secret456',
  })
  @IsString()
  @IsNotEmpty()
  consumerSecret: string;

  @ApiProperty({
    description: 'WooCommerce store URL',
    example: 'https://mystore.com',
  })
  @IsString()
  @IsNotEmpty()
  wooCommerceUrl: string;

  @ApiPropertyOptional({
    description: 'Whether to keep current active organization',
    example: false,
  })
  @IsOptional()
  keepCurrentActiveOrganization?: boolean;
}
