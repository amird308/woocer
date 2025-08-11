import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { MessageService } from './message.service';
import { PrismaModule } from '@common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [NotificationsService, MessageService],
  exports: [NotificationsService, MessageService],
})
export class NotificationsModule {}