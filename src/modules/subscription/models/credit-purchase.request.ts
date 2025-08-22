import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class InitiateCreditPurchaseRequestDto {
  @ApiProperty({ description: 'Credit package ID to purchase' })
  @IsString()
  @IsUUID()
  creditPackageId: string;
}

export class ValidatePurchaseRequestDto {
  @ApiProperty({ description: 'Credit package ID to validate' })
  @IsString()
  @IsUUID()
  creditPackageId: string;
}
