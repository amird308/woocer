import { SetMetadata } from '@nestjs/common';
import { PERMISSIONS_KEY } from '../guards/permission.guard';

export const RequirePermissions = (permissions: Record<string, string[]>) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
