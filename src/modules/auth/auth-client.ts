import { createAuthClient } from 'better-auth/client';
import { organizationClient, openAPIClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  plugins: [
    organizationClient(),
    openAPIClient(),
  ],
});

export type AuthClient = typeof authClient;