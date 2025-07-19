import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { organization, bearer, openAPI } from 'better-auth/plugins';
import { PrismaClient } from '@prisma/client';

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
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  databaseHooks: {},
  plugins: [
    openAPI(),
    organization({
      // Organization plugin configuration
      allowUserToCreateOrganization: true,
      organizationLimit: 5,
      creatorRole: 'owner',
      membershipLimit: 100,
      sendInvitationEmail: async (data) => {
        //TODO send an email here
        console.log(
          `Invitation sent to ${data.email} for organization ${data.organization.name}`,
        );
        console.log(`Invite link: /accept-invitation/${data.id}`);
      },
    }),
    bearer(),
  ],
});
