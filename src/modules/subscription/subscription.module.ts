import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { EmployeeSubscriptionService } from './employee-subscription.service';
import { EmployeeSubscriptionController } from './employee-subscription.controller';
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
    EmployeeSubscriptionController,
    CreditPackageController,
    CreditPurchaseController,
    WebhookController,
  ],
  providers: [
    SubscriptionService,
    EmployeeSubscriptionService,
    CreditPackageService,
    CreditPurchaseService,
    WebhookService,
  ],
  exports: [
    SubscriptionService,
    EmployeeSubscriptionService,
    CreditPackageService,
    CreditPurchaseService,
    WebhookService,
  ],
})
export class SubscriptionModule {}
