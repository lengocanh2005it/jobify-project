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

export const PREMIUM_PRICE = 1200;
