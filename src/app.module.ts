import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { RawBodyMiddleware } from './common/middlewares/raw-body.middleware';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/core-exception.filter';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST'),
          port: config.get<number>('REDIS_PORT'),
          password: config.get<string>('REDIS_PASSWORD'),
          db: 1,
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    AuthModule,
    OrganizationModule,
  ],
  providers: [{ provide: APP_FILTER, useClass: AllExceptionsFilter }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RawBodyMiddleware).forRoutes('*');
  }
}
