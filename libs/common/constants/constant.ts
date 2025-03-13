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

export const PREMIUM_PRICE = 1200;
export const RECRUITER_JOB_LIMIT = 10;
export const CANDIDATE_APPLICATION_LIMIT = 5;
export const RECRUITER_PREMIUM_LIMIT = 100;
export const CANDIDATE_PREMIUM_LIMIT = 50;
export const DEFAULT_THROTTLER_LIMIT = 10;
export const DEFAULT_THROTTLER_TTL = 60000;
