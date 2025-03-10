import { User } from 'apps/users/src/entities';
import { Role } from 'libs/common/constants';

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

declare module 'express' {
  interface Request {
    user?: User;
  }
}
