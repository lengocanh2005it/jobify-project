export enum Role {
  CANDIDATE = 'candidate',
  ADMIN = 'admin',
  RECRUITER = 'recruiter',
}

export enum InterviewType {
  ONLINE = 'online',
  OFFLINE = 'offline',
}

export enum InterviewStatus {
  SCHEDULED = 'scheduled',
  FINISHED = 'finished',
  CANCEL = 'cancel',
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum InterviewResult {
  PASSED = 'passed',
  FAILED = 'failed',
  PENDING = 'pending',
}

export enum Provider {
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  LINKEDIN = 'linkedin',
  LOCAL = 'local',
}

export enum ElasticIndexes {
  USERS = 'users',
  JOBS = 'jobs',
  APPLICATIONS = 'applications',
  INTERVIEWS = 'interviews',
  TRANSACTIONS = 'transactions',
  REVIEWS = 'reviews',
  CONVERSATIONS = 'conversations',
  NOTIFICATIONS = 'notifications',
}

export enum JobCategory {
  BACKEND = 'backend',
  FRONTEND = 'frontend',
  FULLSTACK = 'fullstack',
  DEVOPS = 'devops',
  QA = 'qa',
  DATA = 'data',
  MOBILE = 'mobile',
  OTHER = 'other',
  SOFTWARE_ENGINEER = 'software_engineer',
  TESTER = 'tester',
}

export enum JobType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  REMOTE = 'remote',
  FREELANCE = 'freelance',
}

export enum EmailTemplateNameEnum {
  EMAIL_OTP_VERIFICATION = 'email-otp-verification',
  EMAIL_REPORT = 'email-report',
  EMAIL_ACCOUNT_DELETE_SUCCESS = 'email-account-delete-success',
  EMAIL_NEW_DEVICE_LOGIN = 'email-new-device-login',
  EMAIL_PAYMENT_SUCCESS = 'email-payment-success',
  EMAIL_UPDATE_PASSWORD_SUCCESS = 'email-update-password-success',
  EMAIL_REGISTER_ACCOUNT_SUCCESS = 'email-register-account-success',
  EMAIL_DELETE_CANDIDATE_FROM_APPLICATION = 'email-delete-candidate-from-application',
}

export const SUBJECT_EMAIL_MAP = {
  'email-otp-verification': 'Verify Your Email Address',
  'email-reset-password': 'Reset Your Password',
  'email-update-password-success': 'Your Password Has Been Updated',
  'email-register-account-success': 'Welcome! Your Account Has Been Created',
  'email-account-delete-success': 'Your Account Has Been Deleted',
  'email-report': 'Your Requested Report Is Ready',
  'email-new-device-login': 'New Login Detected on Your Account',
  'email-delete-candidate-from-application':
    'Your Job Application Has Been Removed',
};

export const PREMIUM_PRICE = 1200;
export const RECRUITER_JOB_LIMIT = 10;
export const CANDIDATE_APPLICATION_LIMIT = 5;
export const RECRUITER_PREMIUM_LIMIT = 100;
export const CANDIDATE_PREMIUM_LIMIT = 50;
export const DEFAULT_THROTTLER_LIMIT = 10;
export const DEFAULT_THROTTLER_TTL = 60000;
export const BULLMQ_RETRY_LIMIT = 3;
export const BULLMQ_RETRY_DELAY = 5000;
export const HTTP_MODULE_TIMEOUT = 5000;
export const HTTP_MODULE_MAX_REDIRECT = 5;
export const DEFAULT_CACHE_TTL = 300000;
export const GOOGLE_RECAPTCHA_SCORE = 0.8;
export const SENTRY_TRACES_RATE = 1.0;
export const DEFAULT_TTL_OTP_EXPIRED = 600000;
