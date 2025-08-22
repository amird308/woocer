import { ApiProperty } from '@nestjs/swagger';
import { CreditPackageEntity } from '../../../common/entities';

export class CreditPackageResponseDto
  implements
    Pick<
      CreditPackageEntity,
      | 'id'
      | 'name'
      | 'credits'
      | 'price'
      | 'currency'
      | 'revenueCatProductId'
      | 'isActive'
      | 'sortOrder'
      | 'createdAt'
      | 'updatedAt'
    >
{
  @ApiProperty({ description: 'Package ID' })
  id: string;

  @ApiProperty({ description: 'Package name' })
  name: string;

  @ApiProperty({ description: 'Number of credits in package' })
  credits: number;

  @ApiProperty({ description: 'Price in cents' })
  price: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'RevenueCat product ID' })
  revenueCatProductId: string;

  @ApiProperty({ description: 'Whether package is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Sort order for display' })
  sortOrder: number;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

export class CreditPackageWithValueResponseDto extends CreditPackageResponseDto {
  @ApiProperty({ description: 'Price per credit in cents' })
  pricePerCredit: number;

  @ApiProperty({
    description: 'Savings percentage compared to smallest package',
  })
  savingsPercentage?: number;

  @ApiProperty({ description: 'Formatted display price' })
  displayPrice: string;
}
