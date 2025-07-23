import { createAuthClient } from 'better-auth/client';
import { organizationClient } from 'better-auth/client/plugins';
import { openAPI } from 'better-auth/plugins';
import { auth } from './auth';

export const authClient = createAuthClient({
  baseURL: process.env.API_URL || 'http://localhost:3000/api/auth',
  plugins: [organizationClient({ $inferAuth: {} as typeof auth }), openAPI()],
});
