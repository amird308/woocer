export interface UserEntity {
  id: string;
  name?: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  password?: string;
  signalId?: string; // OneSignal player ID for push notifications
  language?: string; // User's preferred language (en, fa, etc.)
  createdAt: Date;
  updatedAt: Date;
}