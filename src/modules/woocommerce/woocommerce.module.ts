import { Module } from '@nestjs/common';
import { WooCommerceController } from './woocommerce.controller';
import { WooCommerceService } from './woocommerce.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { NotificationsModule } from '@common/notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [WooCommerceController],
  providers: [WooCommerceService],
  exports: [WooCommerceService],
})
export class WooCommerceModule {}
