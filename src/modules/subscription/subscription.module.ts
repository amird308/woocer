import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { SponsorshipService } from './sponsorship.service';
import { SponsorshipController } from './sponsorship.controller';
import { CreditPackageService } from './credit-package.service';
import { CreditPackageController } from './credit-package.controller';
import { CreditPurchaseService } from './credit-purchase.service';
import { CreditPurchaseController } from './credit-purchase.controller';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { BetterAuthModule } from '@/common/better-auth/auth.module';

@Module({
  imports: [PrismaModule, BetterAuthModule],
  controllers: [
    SubscriptionController,
    SponsorshipController,
    CreditPackageController,
    CreditPurchaseController,
    WebhookController,
  ],
  providers: [
    SubscriptionService,
    SponsorshipService,
    CreditPackageService,
    CreditPurchaseService,
    WebhookService,
  ],
  exports: [
    SubscriptionService,
    SponsorshipService,
    CreditPackageService,
    CreditPurchaseService,
    WebhookService,
  ],
})
export class SubscriptionModule {}
