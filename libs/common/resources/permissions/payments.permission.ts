export const paymentPermissions = [
  {
    name: 'payment@create',
    description: 'Initiate a new payment',
    module: 'payment',
  },
  {
    name: 'payment@read',
    description: 'View payment details',
    module: 'payment',
  },
  {
    name: 'payment@update',
    description: 'Update payment information',
    module: 'payment',
  },
  {
    name: 'payment@delete',
    description: 'Cancel or remove a payment',
    module: 'payment',
  },
  {
    name: 'payment@verify',
    description: 'Verify a completed payment',
    module: 'payment',
  },
  {
    name: 'payment@refund',
    description: 'Issue a refund to the user',
    module: 'payment',
  },
  {
    name: 'payment@history',
    description: 'Access payment history',
    module: 'payment',
  },
  {
    name: 'payment@download_invoice',
    description: 'Download invoice for a payment',
    module: 'payment',
  },
];
