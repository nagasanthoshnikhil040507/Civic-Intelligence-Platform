export enum Role {
  CITIZEN = 'citizen',
  OFFICER = 'officer',
  ADMIN = 'admin',
}

export const Permissions = {
  MANAGE_USERS: 'manage:users',
  VIEW_COMPLAINTS: 'view:complaints',
  MANAGE_COMPLAINTS: 'manage:complaints',
  VIEW_DEPARTMENTS: 'view:departments',
  MANAGE_DEPARTMENTS: 'manage:departments',
  VIEW_ANALYTICS: 'view:analytics',
};

export const RolePermissions: Record<Role, string[]> = {
  [Role.CITIZEN]: [
    Permissions.VIEW_COMPLAINTS,
  ],
  [Role.OFFICER]: [
    Permissions.VIEW_COMPLAINTS,
    Permissions.MANAGE_COMPLAINTS,
    Permissions.VIEW_DEPARTMENTS,
  ],
  [Role.ADMIN]: Object.values(Permissions),
};
