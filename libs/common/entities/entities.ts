import { Application } from 'apps/applications/src/entities';
import { Interview } from 'apps/interviews/src/entities';
import { Company, Job, Requirement, SavedJob } from 'apps/jobs/src/entities';
import { Conversation, Message } from 'apps/messages/src/entities';
import {
  Notification,
  UserNotification,
} from 'apps/notifications/src/entities';
import { Transaction } from 'apps/payments/src/entities';
import { Review } from 'apps/reviews/src/entities';
import { Role, Skill, User } from 'apps/users/src/entities';

export const entities = [
  User,
  Role,
  Requirement,
  Job,
  Company,
  Application,
  Interview,
  SavedJob,
  Message,
  Conversation,
  Notification,
  UserNotification,
  Transaction,
  Review,
  Skill,
];
