import { Module } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuthService } from '../../common/better-auth/auth.service';

@Module({
  imports: [PrismaModule],
  controllers: [OrganizationController],
  providers: [OrganizationService, AuthService],
  exports: [OrganizationService],
})
export class OrganizationModule {}