import { createAccessControl } from 'better-auth/plugins/access';

const statement = {
  store: ['update', 'delete'],
  member: ['create', 'update', 'delete'],
  invitation: ['create', 'cancel'],
} as const;

export const ac = createAccessControl(statement);

export const employee = ac.newRole({});
export const owner = ac.newRole({
  store: ['update', 'delete'],
  member: ['create', 'update', 'delete'],
  invitation: ['create', 'cancel'],
});
