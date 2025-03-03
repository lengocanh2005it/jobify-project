import { User } from 'apps/users/src/entities/users.entity';
import { Role } from 'libs/common/constants';

export type CreateNotificationDto = {
  title: string;
  message: string;
  type: string;
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

declare module 'express' {
  interface Request {
    user?: User;
  }
}
