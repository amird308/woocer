import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, IsUUID } from 'class-validator';

export class AssignEmployeeToSubscriptionRequestDto {
  @ApiProperty({ description: 'User ID to assign to subscription' })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Organization ID where the subscription will be used',
  })
  @IsUUID()
  organizationId: string;
}

export class ConsumeCreditsFromEmployeeSubscriptionRequestDto {
  @ApiProperty({
    description: 'Organization ID where credits are being consumed',
  })
  @IsUUID()
  organizationId: string;

  @ApiProperty({ description: 'Number of credits to consume' })
  @IsInt()
  @Min(1)
  credits: number;

  @ApiProperty({ description: 'Description of the credit usage' })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Optional metadata for the transaction',
    required: false,
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
