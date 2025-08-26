import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { organization, openAPI, emailOTP } from 'better-auth/plugins';
import { PrismaClient } from '@prisma/client';
import { ac, employee, owner } from './permissions';
import { EmailService } from '../../services/email.service';
import { ConfigService } from '@nestjs/config';
// import { OrganizationEncryptionManager } from '../../utilities/encryption.util';

const prisma = new PrismaClient();

const isProduction = process.env.NODE_ENV === 'production';

export const auth = betterAuth({
  // TODO: add production domain
  trustedOrigins: ['http://localhost:5173'],
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  logger: {
    level: 'debug',
  },
  advanced: {
    database: {
      generateId: false,
    },
    crossSubDomainCookies: {
      enabled: isProduction,
    },
    useSecureCookies: isProduction,
    defaultCookieAttributes: {
      secure: isProduction,
      httpOnly: true,
      sameSite: isProduction ? 'none' : 'lax',
      partitioned: false,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
  },
  onAPIError: {
    onError: (error) => {
      console.error(error);
      throw error;
    },
    throw: true,
  },
  socialProviders: {
    // google: {
    //   clientId: process.env.GOOGLE_CLIENT_ID as string,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    // },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      signalId: {
        type: 'string',
        input: true,
        required: true,
      },
      language: {
        type: 'string',
        input: true,
        required: true,
        defaultValue: 'en',
      },
    },
  },

  databaseHooks: {},
  plugins: [
    openAPI(),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        try {
          if (type === 'email-verification' || type === 'sign-in') {
            const configService = new ConfigService();
            const emailService = new EmailService(configService);
            await emailService.sendOTPEmail(email, otp, type);
          }
        } catch (error) {
          console.error('Failed to send OTP email:', error);
          throw error;
        }
      },
    }),
    organization({
      ac,
      roles: {
        owner,
        employee,
      },
      // Organization plugin configuration
      allowUserToCreateOrganization: true,
      organizationLimit: 10,
      creatorRole: 'OWNER',
      membershipLimit: 100,
      organizationCreation: {
        afterCreate: async (data) => {
          try {
            // Import services dynamically to avoid circular dependency
            const { WooCommerceService } = await import(
              '../../../modules/woocommerce/woocommerce.service'
            );
            const { PrismaService } = await import(
              '../../prisma/prisma.service'
            );
            const { NotificationsService } = await import(
              '../../notifications/notifications.service'
            );
            const { MessageService } = await import(
              '../../notifications/message.service'
            );

            const prismaService = new PrismaService();
            const messageService = new MessageService();
            const notificationsService = new NotificationsService(
              prismaService,
              messageService,
            );
            const wooCommerceService = new WooCommerceService(
              prismaService,
              notificationsService,
            );

            // Setup WooCommerce integration for the new organization
            await wooCommerceService.handleOrganizationCreated(
              data.organization.id,
            );
          } catch (error) {
            console.error(
              'Failed to setup WooCommerce integration for organization:',
              error,
            );
            // Don't throw error to prevent organization creation failure
          }
        },
      },
      sendInvitationEmail: async (data) => {
        try {
          const configService = new ConfigService();
          const emailService = new EmailService(configService);
          const baseUrl =
            process.env.BETTER_AUTH_URL ||
            process.env.APP_URL ||
            'http://localhost:3000';
          const inviteLink = `${baseUrl}/accept-invitation/${data.id}`;

          await emailService.sendInvitationEmail(
            data.email,
            data.organization.name,
            inviteLink,
            data.inviter?.user.name,
          );

          console.log(
            `Invitation sent to ${data.email} for organization ${data.organization.name}`,
          );
        } catch (error) {
          console.error('Failed to send invitation email:', error);
          // Don't throw error to prevent invitation creation failure
        }
      },
      schema: {
        organization: {
          additionalFields: {
            slug: {
              type: 'string',
              input: true,
              required: false,
            },
            consumerKey: {
              type: 'string',
              input: true,
              required: true,
            },
            consumerSecret: {
              type: 'string',
              input: true,
              required: true,
            },
            wooCommerceUrl: {
              type: 'string',
              input: true,
              required: true,
            },
          },
        },
      },
    }),
  ],
}) as any;
