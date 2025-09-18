import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserOrganizationWithSecretsDto {
  @ApiProperty({
    description: 'Organization ID',
    example: 'uuid',
  })
  organizationId: string;

  @ApiProperty({
    description: 'Organization name',
    example: 'My Store',
  })
  organizationName: string;

  @ApiProperty({
    description: 'Organization slug',
    example: 'my-store',
  })
  organizationSlug: string;

  @ApiPropertyOptional({
    description: 'Organization logo URL',
    example: 'https://example.com/logo.png',
  })
  organizationLogo?: string;

  @ApiProperty({
    description: 'User-specific public key for this organization',
    example: '-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----',
  })
  publicKey: string;

  @ApiProperty({
    description:
      'User-specific private key for this organization (store securely on frontend)',
    example: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----',
  })
  privateKey: string;
}

export class GenerateUserSecretsResponseDto {
  @ApiProperty({
    description: 'List of organizations with generated secrets',
    type: [UserOrganizationWithSecretsDto],
  })
  organizations: UserOrganizationWithSecretsDto[];

  @ApiProperty({
    description: 'Success message',
    example: 'Generated secrets for 3 organizations',
  })
  message: string;
}

export class UserOrganizationPublicDto {
  @ApiProperty({
    description: 'Organization ID',
    example: 'uuid',
  })
  organizationId: string;

  @ApiProperty({
    description: 'Organization name',
    example: 'My Store',
  })
  organizationName: string;

  @ApiProperty({
    description: 'Organization slug',
    example: 'my-store',
  })
  organizationSlug: string;

  @ApiPropertyOptional({
    description: 'Organization logo URL',
    example: 'https://example.com/logo.png',
  })
  organizationLogo?: string;

  @ApiProperty({
    description: 'User-specific public key for this organization',
    example: '-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----',
  })
  publicKey: string;

  @ApiProperty({
    description:
      'Encrypted organization secrets (decrypt with private key on frontend)',
    example: 'encrypted_data_string',
  })
  encryptedData: string;

  @ApiProperty({
    description: 'When this user secret was created',
  })
  createdAt: Date;
}

export class GetUserOrganizationsResponseDto {
  @ApiProperty({
    description: 'List of user organizations with encrypted data',
    type: [UserOrganizationPublicDto],
  })
  organizations: UserOrganizationPublicDto[];
}
