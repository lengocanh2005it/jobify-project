export const adminPermissions = [
  {
    name: 'admin@view_reports',
    description: 'View analytics and reports',
    module: 'admin',
  },
  {
    name: 'admin@check_health',
    description: 'Check health of application',
    module: 'admin',
  },
  {
    name: 'admin@send_message',
    description: 'Allow admin to send messages to candidates or other admins.',
    module: 'admin',
  },
  {
    name: 'admin@manage_users',
    description: 'Allow admin to manage users.',
    module: 'admin',
  },
];

export const superAdminPermissions = [
  {
    name: 'superadmin@revoke_roles',
    description: 'Remove roles from users, except when the role is superadmin.',
    module: 'admin',
  },
];
