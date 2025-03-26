import { Provider, Role } from 'libs/common/constants';

export type CreateNotificationDto = {
  title: string;
  message: string;
  type: string;
  metadata?: Record<string, any>;
};

export type CreateApplication = {
  jobId: string;
  userId: string;
  resumeFile: Express.Multer.File;
  coverLetterFile?: Express.Multer.File;
};

export type UpdateApplication = {
  applicationId: string;
  resumeFile: Express.Multer.File;
  coverLetterFile?: Express.Multer.File;
};

export type UrlResponseType = {
  fieldname: string;
  url: string;
};

export type JwtPayload = {
  userId: string;
  role: Role;
  iat: number;
  exp: number;
};

export type RpcExceptionType = {
  statusCode: number;
  message: string;
};

export type SocialLogin = {
  provider: Provider;
  provider_id: string;
  full_name: string;
  email: string;
  avatar_url: string;
};

export type CreateSocialAccount = {
  socialLogin: SocialLogin;
  role: Role.CANDIDATE | Role.RECRUITER;
};

export type ReportData = {
  company: string;
  totalJobs: string;
  totalApplications: string;
  totalSavedJobs: string;
  revenue: string;
  totalClosedJobs: string;
};

declare module 'express' {
  interface Request {
    user?: any;
  }
}
