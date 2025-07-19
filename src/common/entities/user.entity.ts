export interface UserEntity {
  id: string;
  name?: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  password?: string;
  createdAt: Date;
  updatedAt: Date;
}