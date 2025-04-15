export const jobPermissions = [
  { name: 'job@create', description: 'Post a new job', module: 'job' },
  { name: 'job@read', description: 'View job listings', module: 'job' },
  { name: 'job@update', description: 'Edit job posting', module: 'job' },
  { name: 'job@delete', description: 'Remove job posting', module: 'job' },
  { name: 'job@approve', description: 'Approve job posting', module: 'job' },
  { name: 'job@reject', description: 'Reject job posting', module: 'job' },
  { name: 'job@save_job', description: 'Saved job posting', module: 'job' },
  {
    name: 'job@remove_saved_job',
    description: 'Remove saved job posting',
    module: 'job',
  },
];
