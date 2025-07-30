import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { organization, openAPI } from 'better-auth/plugins';
import { PrismaClient } from '@prisma/client';
import { ac, employee, owner } from './permissions';
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

  databaseHooks: {},
  plugins: [
    openAPI(),
    organization({
      ac,
      roles: {
        owner,
        employee,
      },
      // Organization plugin configuration
      allowUserToCreateOrganization: true,
      organizationLimit: 5,
      creatorRole: 'OWNER',
      membershipLimit: 100,
      organizationCreation: {
        afterCreate: async (data) => {
          try {
            // Import WooCommerceService dynamically to avoid circular dependency
            const { WooCommerceService } = await import(
              '../../../modules/woocommerce/woocommerce.service'
            );
            const { PrismaService } = await import(
              '../../prisma/prisma.service'
            );

            const prismaService = new PrismaService();
            const wooCommerceService = new WooCommerceService(prismaService);

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
        //TODO send an email here
        console.log(
          `Invitation sent to ${data.email} for organization ${data.organization.name}`,
        );
        console.log(`Invite link: /accept-invitation/${data.id}`);
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
