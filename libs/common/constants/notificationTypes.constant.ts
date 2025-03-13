export const NotificationTypes = {
  // Candidate Notifications
  JOB_APPLICATION_SUBMITTED: {
    key: 'job_application_submitted',
    title: 'Application Submitted',
    description: 'Your job application has been successfully submitted.',
  },
  JOB_APPLICATION_REVIEWED: {
    key: 'job_application_reviewed',
    title: 'Application Reviewed',
    description: 'Your job application is under review by the employer.',
  },
  JOB_APPLICATION_ACCEPTED: {
    key: 'job_application_accepted',
    title: 'Application Accepted',
    description: 'Congratulations! Your job application has been accepted.',
  },
  JOB_APPLICATION_REJECTED: {
    key: 'job_application_rejected',
    title: 'Application Rejected',
    description: 'Unfortunately, your job application has been rejected.',
  },
  INTERVIEW_SCHEDULED: {
    key: 'interview_scheduled',
    title: 'Interview Scheduled',
    description: 'An interview has been scheduled for your job application.',
  },
  INTERVIEW_REMINDER: {
    key: 'interview_reminder',
    title: 'Interview Reminder',
    description: 'Reminder: You have an upcoming interview.',
  },
  INTERVIEW_RESULT: {
    key: 'interview_result',
    title: 'Interview Result',
    description: 'You have received the result of your interview.',
  },
  OFFER_RECEIVED: {
    key: 'offer_received',
    title: 'Job Offer Received',
    description: 'You have received a job offer from the employer.',
  },
  OFFER_ACCEPTED: {
    key: 'offer_accepted',
    title: 'Job Offer Accepted',
    description: 'You have accepted the job offer. Congratulations!',
  },
  OFFER_DECLINED: {
    key: 'offer_declined',
    title: 'Job Offer Declined',
    description: 'You have declined the job offer.',
  },
  INTERVIEW_CANCELED_BY_ADMIN: {
    key: 'interview_canceled_by_admin',
    title: 'Interview Canceled by Admin',
    description:
      'The interview you scheduled has been canceled by the admin due to unforeseen circumstances. Please check with the admin for further details.',
  },
  INTERVIEW_DELETED_BY_ADMIN: {
    key: 'interview_deleted_by_admin',
    title: 'Interview Deleted by Admin',
    description:
      'The interview has been permanently deleted by the admin. Please contact support for any concerns.',
  },

  // Employer Notifications
  NEW_APPLICATION_RECEIVED: {
    key: 'new_application_received',
    title: 'New Application Received',
    description: 'A candidate has submitted a new job application.',
  },
  APPLICATION_STATUS_UPDATED: {
    key: 'application_status_updated',
    title: 'Application Status Updated',
    description: 'The status of a job application has been updated.',
  },
  INTERVIEW_RESPONSE_RECEIVED: {
    key: 'interview_response_received',
    title: 'Interview Response Received',
    description: 'A candidate has responded to the interview invitation.',
  },
  OFFER_RESPONSE_RECEIVED: {
    key: 'offer_response_received',
    title: 'Offer Response Received',
    description: 'A candidate has responded to the job offer.',
  },
  APPLICATION_DELETED: {
    key: 'application_deleted',
    title: 'Application Deleted',
    description: 'A candidate has withdrawn their job application.',
  },
  NEW_REVIEW_RECEIVED: {
    key: 'new_review_received',
    title: 'New Company Review',
    description: 'A new review has been posted for your company.',
  },
  REVIEW_DELETED: {
    key: 'review_deleted',
    title: 'Company Review Deleted',
    description: 'A review for your company has been deleted.',
  },
  JOB_APPROVED: {
    key: 'job_approved',
    title: 'Job Approved',
    description:
      'Your job posting has been approved by an admin and is now live.',
  },
  JOB_REJECTED: {
    key: 'job_rejected',
    title: 'Job Rejected',
    description:
      'Your job posting has been rejected by an admin. Please review and update your job details.',
  },
  JOB_EXPIRED: {
    key: 'job_expired',
    title: 'Job Expired',
    description:
      'The job posting you created has expired and is no longer active. Please review and update the job details if needed.',
  },

  // Systems Notifications
  ACCOUNT_REGISTRATION: {
    key: 'account_registration',
    title: 'Welcome Aboard!',
    description: 'Your account has been successfully registered.',
  },
  PASSWORD_RESET: {
    key: 'password_reset',
    title: 'Password Reset Successful',
    description: 'Your password has been successfully changed.',
  },
  PROFILE_UPDATE: {
    key: 'profile_update',
    title: 'Profile Updated',
    description: 'Your profile information has been updated.',
  },
  SUBSCRIPTION_EXPIRING: {
    key: 'subscription_expiring',
    title: 'Subscription Expiring Soon',
    description: 'Your subscription is about to expire. Renew to continue.',
  },
  NEW_MESSAGE: {
    key: 'new_message',
    title: 'New Message Received',
    description: 'You have received a new message from another user.',
  },
  PREMIUM_PAID_SUCCESS: {
    key: 'premium_paid_success',
    title: 'Premium Paid Success',
    description:
      'You have successfully purchased the Premium Package, valid for 30 days from today!',
  },

  // Job Suggestions
  RECOMMENDED_JOB: {
    key: 'recommended_job',
    title: 'New Job Suggestion',
    description: 'A job that matches your skills profile has been recommended.',
  },
  SAVED_JOB_UPDATE: {
    key: 'saved_job_update',
    title: 'Saved Job Update',
    description: 'A job you saved has been updated.',
  },
  JOB_DEADLINE_REMINDER: {
    key: 'job_deadline_reminder',
    title: 'Job Deadline Reminder',
    description: 'A job you are interested in is closing soon.',
  },
} as const;

export type NotificationType = keyof typeof NotificationTypes;
