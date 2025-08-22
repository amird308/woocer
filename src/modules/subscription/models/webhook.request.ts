import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsObject,
  IsDateString,
  IsOptional,
  IsNumber,
} from 'class-validator';

export class RevenueCatWebhookDto {
  @ApiProperty({ description: 'Webhook event type' })
  @IsString()
  event_type: string;

  @ApiProperty({ description: 'API version' })
  @IsString()
  api_version: string;

  @ApiProperty({ description: 'Event data' })
  @IsObject()
  event: {
    aliases: string[];
    app_id: string;
    app_user_id: string;
    commission_percentage?: number;
    country_code: string;
    currency: string;
    entitlement_id?: string;
    entitlement_ids?: string[];
    environment: string;
    event_timestamp_ms: number;
    expiration_at_ms?: number;
    id: string;
    is_family_share?: boolean;
    offer_code?: string;
    original_app_user_id: string;
    original_transaction_id: string;
    period_type?: string;
    presented_offering_id?: string;
    price?: number;
    price_in_purchased_currency?: number;
    product_id: string;
    purchased_at_ms?: number;
    store: string;
    subscriber_attributes?: Record<string, any>;
    takehome_percentage?: number;
    tax_percentage?: number;
    transaction_id: string;
    type: string;
  };
}

export class CreditPurchaseWebhookDto {
  @ApiProperty({ description: 'Purchase transaction ID' })
  @IsString()
  transactionId: string;

  @ApiProperty({ description: 'RevenueCat customer ID' })
  @IsString()
  customerId: string;

  @ApiProperty({ description: 'Product ID' })
  @IsString()
  productId: string;

  @ApiProperty({ description: 'Purchase price in cents' })
  @IsNumber()
  price: number;

  @ApiProperty({ description: 'Currency code' })
  @IsString()
  currency: string;

  @ApiProperty({ description: 'Purchase timestamp' })
  @IsDateString()
  purchasedAt: string;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
