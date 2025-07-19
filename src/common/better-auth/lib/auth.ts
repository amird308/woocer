import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { organization, bearer, openAPI } from 'better-auth/plugins';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const isProduction = process.env.NODE_ENV === 'production';

console.log(process.env.NODE_ENV);

export const auth = betterAuth({
  trustedOrigins: ['http://localhost:5173', 'https://rezsaz.ir'],
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
      domain: isProduction ? '.rezsaz.ir' : undefined,
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
  databaseHooks: {
    session: {
      create: {
        after: async (session) => {
          // Get the user data
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
          });

          if (!user) return;

          // Check if user already has organizations
          const userMemberships = await prisma.member.findMany({
            where: { userId: user.id },
          });

          // If user has no organizations, create one
          if (userMemberships.length === 0) {
            // Create a default organization for the user
            const newOrg = await prisma.organization.create({
              data: {
                name: `${user.name || user.email.split('@')[0]}'s Workspace`,
                slug: `${user.email.split('@')[0]}-${Date.now()}`,
                members: {
                  create: {
                    userId: user.id,
                    role: 'owner',
                  },
                },
              },
            });

            // Set this new organization as active
            await prisma.session.update({
              where: { id: session.id },
              data: { activeOrganizationId: newOrg.id },
            });

            console.log(
              `Created organization "${newOrg.name}" for user ${user.email}`,
            );
          }

          // if user has one org active default organization
          if (userMemberships.length === 1) {
            await prisma.session.update({
              where: { id: session.id },
              data: { activeOrganizationId: userMemberships[0].organizationId },
            });
          }
        },
      },
    },
  },
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
