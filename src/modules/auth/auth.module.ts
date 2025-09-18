import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { UserSecretService } from './user-secret.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { BetterAuthModule } from '@/common/better-auth/auth.module';
import { WooCommerceModule } from '../woocommerce/woocommerce.module';

@Module({
  imports: [PrismaModule, BetterAuthModule, WooCommerceModule],
  controllers: [AuthController],
  providers: [UserSecretService],
  exports: [UserSecretService],
})
export class AuthModule {}
