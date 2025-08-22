import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { CreditPackageService } from './credit-package.service';
import { CreditPackageController } from './credit-package.controller';
import { CreditPurchaseService } from './credit-purchase.service';
import { CreditPurchaseController } from './credit-purchase.controller';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    SubscriptionController,
    CreditPackageController,
    CreditPurchaseController,
    WebhookController,
  ],
  providers: [
    SubscriptionService,
    CreditPackageService,
    CreditPurchaseService,
    WebhookService,
  ],
  exports: [
    SubscriptionService,
    CreditPackageService,
    CreditPurchaseService,
    WebhookService,
  ],
})
export class SubscriptionModule {}
