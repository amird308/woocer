import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super();
  }

  async onModuleInit() {
    try {
      await this.ensureDatabase();
      await this.$connect();
      this.logger.log('Database connected successfully');
    } catch (error) {
      this.logger.error('Failed to initialize database:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async ensureDatabase() {
    try {
      // First, try to connect to see if database exists
      await this.$connect();
      await this.$disconnect();
      this.logger.log('Database exists, running migrations...');
    } catch (error) {
      if (error.code === 'P1003' || error.message.includes('does not exist')) {
        this.logger.log('Database does not exist, creating with db push...');
        await this.createDatabaseWithSchema();
      } else {
        throw error;
      }
    }
  }

  private async createDatabaseWithSchema() {
    try {
      const { stderr } = await execAsync('npx prisma db push --force-reset');
      if (stderr && !stderr.includes('Warning')) {
        this.logger.warn('DB push warnings:', stderr);
      }
      this.logger.log('Database and schema created successfully');
    } catch (error) {
      this.logger.error('Failed to create database with schema:', error);
      throw error;
    }
  }
}
