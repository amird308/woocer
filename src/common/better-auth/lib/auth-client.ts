import { createAuthClient } from 'better-auth/client';
import { organizationClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: process.env.API_URL || 'http://localhost:3000/api/auth',
  plugins: [
    organizationClient({
      // Optional configuration for organization client
    }),
  ],
});
