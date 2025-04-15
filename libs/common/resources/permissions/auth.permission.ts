export const authPermissions = [
  {
    name: 'auth@login',
    description: 'Login to the system',
    module: 'auth',
  },
  {
    name: 'auth@logout',
    description: 'Logout from the system',
    module: 'auth',
  },
  {
    name: 'auth@register',
    description: 'Register a new user account',
    module: 'auth',
  },
  {
    name: 'auth@verify_email',
    description: 'Verify user email address',
    module: 'auth',
  },
  {
    name: 'auth@reset_password',
    description: 'Reset user password',
    module: 'auth',
  },
  {
    name: 'auth@change_password',
    description: 'Change current password',
    module: 'auth',
  },
  {
    name: 'auth@enable_2fa',
    description: 'Enable two-factor authentication',
    module: 'auth',
  },
  {
    name: 'auth@disable_2fa',
    description: 'Disable two-factor authentication',
    module: 'auth',
  },
  {
    name: 'auth@refresh_token',
    description: 'Refresh access token',
    module: 'auth',
  },
];
