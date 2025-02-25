import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Application } from 'apps/applications/src/entities/applications.entity';
import { Job } from 'apps/jobs/src/entities/jobs.entity';
import { NotificationTypes } from 'libs/common/constants';
import { ApproveApplicationsDto } from 'libs/common/dtos/approve-applications.dto';
import { CreateApplicationDto } from 'libs/common/dtos/create-application.dto';
import { UpdateApplicationDto } from 'libs/common/dtos/update-application.dto';
import { lastValueFrom } from 'rxjs';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    @Inject('JOBS_SERVICE') private readonly rabbitMqJobClient: ClientProxy,
    @InjectDataSource() private readonly dataSource: DataSource,
    @Inject('NOTIFICATIONS_SERVICE')
    private readonly rabbitMqNotificationClient: ClientProxy,
  ) {}

  public handleCreateApplication = async (
    createApplicationDto: CreateApplicationDto,
    userId: string,
  ) => {
    try {
      const { job_id: jobId } = createApplicationDto;

      const job = await lastValueFrom<Job | undefined>(
        this.rabbitMqJobClient.send({ cmd: 'get-jobs' }, jobId),
      );

      if (!job) throw new RpcException(`Job With ID: '${jobId}' Not Found.`);

      let application = await this.applicationRepository.findOne({
        where: {
          candidate: { id: userId },
          job: { id: jobId },
        },
        relations: ['candidate', 'job', 'job.recruiter'],
      });

      if (application)
        throw new BadRequestException('You have applied for this position.');

      application = this.applicationRepository.create(createApplicationDto);

      await this.applicationRepository.save(application);

      await this.dataSource
        .createQueryBuilder()
        .relation(Application, 'candidate')
        .of(application.id)
        .set(userId);

      application = (await this.applicationRepository.findOne({
        where: {
          candidate: { id: userId },
          job: { id: jobId },
        },
        relations: ['candidate', 'job', 'job.recruiter'],
      })) as Application;

      const { candidate, ...res } = application;

      const { password, ...resData } = candidate;

      const { password: recruiterPassword, ...resRecruiterData } =
        res.job.recruiter;

      const { title, description, key } =
        NotificationTypes.NEW_APPLICATION_RECEIVED;

      this.rabbitMqNotificationClient.emit('create-notification', {
        data: {
          title,
          message: description,
          type: key,
        },
        userIds: [res.job.recruiter.id],
      });

      return {
        ...res,
        candidate: resData,
        job: {
          ...res.job,
          recruiter: resRecruiterData,
        },
      };
    } catch (err) {
      console.error(err);
    }
  };

  public handleGetApplications = async () => {
    try {
      return (
        await this.applicationRepository.find({
          relations: ['candidate', 'job'],
        })
      ).map((app) => {
        const { candidate, ...res } = app;

        const { password, ...resData } = candidate;

        return {
          ...res,
          candidate: resData,
        };
      });
    } catch (err) {
      console.error(err);
    }
  };

  public handleGetApplication = async (applicationId: string, role: string) => {
    try {
      const application = await this.applicationRepository.findOne({
        where: {
          id: applicationId,
        },
        relations: ['candidate'],
      });

      if (!application)
        throw new RpcException(
          `Application With ID: '${applicationId}' Not Found.`,
        );

      if (role === 'admin' || role === 'recruiter') {
        const { title, description, key } =
          NotificationTypes.JOB_APPLICATION_REVIEWED;

        this.rabbitMqNotificationClient.emit('create-notification', {
          data: {
            title,
            message: description,
            type: key,
          },
          userIds: [application.candidate.id],
        });
      }

      return application;
    } catch (err) {
      console.error(err);
    }
  };

  public handleDeleteApplication = async (applicationId: string) => {
    try {
      const application = await this.applicationRepository.findOne({
        where: {
          id: applicationId,
        },
        relations: ['job', 'job.recruiter'],
      });

      if (!application)
        throw new RpcException(
          `Application With ID: '${applicationId}' Not Found.`,
        );

      const { title, description, key } = NotificationTypes.APPLICATION_DELETED;

      this.rabbitMqNotificationClient.emit('create-notification', {
        data: {
          title,
          message: description,
          type: key,
        },
        userIds: [application.job.recruiter.id],
      });

      return { msg: 'Application deleted successfully.' };
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  public handleUpdateApplication = async (
    applicationId: string,
    updateApplicationDto: UpdateApplicationDto,
  ) => {
    try {
      const application = await this.applicationRepository.findOne({
        where: {
          id: applicationId,
        },
        relations: ['job', 'job.recruiter'],
      });

      if (!application)
        throw new RpcException(
          `Application With ID: '${applicationId}' Not Found.`,
        );

      await this.applicationRepository.update(
        { id: applicationId },
        updateApplicationDto,
      );

      const { title, description, key } =
        NotificationTypes.APPLICATION_STATUS_UPDATED;

      this.rabbitMqNotificationClient.emit('create-notification', {
        data: {
          title,
          message: description,
          type: key,
        },
        userIds: [application.job.recruiter.id],
      });

      return await this.applicationRepository.findOneBy({ id: applicationId });
    } catch (err) {
      console.error(err);
    }
  };

  public handleApproveApplications = async (applicationIds: string[]) => {
    try {
      const applications: Application[] = [];
      const candidateIds: string[] = [];

      for (const applicationId of applicationIds) {
        const application = await this.applicationRepository.findOne({
          where: {
            id: applicationId,
          },
          relations: ['candidate'],
        });

        if (!application)
          throw new RpcException(
            `Application With ID: '${applicationId}' Not Found.`,
          );

        await this.applicationRepository.update(
          { id: applicationId },
          {
            status: 'approved',
          },
        );

        candidateIds.push(application.candidate.id);
        applications.push(application);
      }

      const { JOB_APPLICATION_ACCEPTED } = NotificationTypes;

      const { title, description, key } = JOB_APPLICATION_ACCEPTED;

      this.rabbitMqNotificationClient.emit('create-notification', {
        data: {
          title,
          message: description,
          type: key,
        },
        userIds: candidateIds,
      });

      return applications;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  public handleRejectApplications = async (applicationIds: string[]) => {
    try {
      const applications: Application[] = [];
      const candidateIds: string[] = [];

      for (const applicationId of applicationIds) {
        const application = await this.applicationRepository.findOne({
          where: {
            id: applicationId,
          },
          relations: ['candidate'],
        });

        if (!application)
          throw new RpcException(
            `Application With ID: '${applicationId}' Not Found.`,
          );

        await this.applicationRepository.update(
          { id: applicationId },
          {
            status: 'rejected',
          },
        );

        candidateIds.push(application.candidate.id);
        applications.push(application);
      }

      const { JOB_APPLICATION_REJECTED } = NotificationTypes;

      const { title, description, key } = JOB_APPLICATION_REJECTED;

      this.rabbitMqNotificationClient.emit('create-notification', {
        data: {
          title,
          message: description,
          type: key,
        },
        userIds: candidateIds,
      });

      return applications;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };
}
