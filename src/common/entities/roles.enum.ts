import { Role as PrismaRole } from '@prisma/client';

export const Role = {
  OWNER: PrismaRole.OWNER,
  EMPLOYEE: PrismaRole.EMPLOYEE,
} as const;

export type Role = (typeof Role)[keyof typeof Role];
