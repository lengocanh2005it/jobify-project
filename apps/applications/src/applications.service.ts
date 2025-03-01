import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Application } from 'apps/applications/src/entities/applications.entity';
import { Job } from 'apps/jobs/src/entities/jobs.entity';
import { NotificationTypes } from 'libs/common/constants';
import { ProcessApplicationsDto } from 'libs/common/dtos/process-applications.dto';
import {
  CreateApplication,
  UpdateApplication,
  UrlResponseType,
} from 'libs/common/utils/types';
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
    @Inject('UPLOADS_SERVICE')
    private readonly rabbitMqUploadClient: ClientProxy,
  ) {}

  public handleCreateApplication = async (
    createApplication: CreateApplication,
  ) => {
    try {
      const { jobId, resumeFile, coverLetterFile, userId } = createApplication;

      const files = [resumeFile];

      if (coverLetterFile) {
        files.push(coverLetterFile);
      }

      const response = await lastValueFrom<UrlResponseType[]>(
        this.rabbitMqUploadClient.send({ cmd: 'upload-files' }, files),
      );

      const job = await lastValueFrom<Job | undefined>(
        this.rabbitMqJobClient.send({ cmd: 'get-job' }, jobId),
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

      const [resume, coverLetter] = response;

      application = this.applicationRepository.create({
        resume_link: resume.url,
        ...(coverLetterFile && coverLetter
          ? { cover_letter_link: coverLetter.url }
          : {}),
        applied_at: new Date(),
      });

      await this.applicationRepository.save(application);

      await this.dataSource
        .createQueryBuilder()
        .relation(Application, 'candidate')
        .of(application.id)
        .set(userId);

      await this.dataSource
        .createQueryBuilder()
        .relation(Application, 'job')
        .of(application.id)
        .set(jobId);

      application = (await this.applicationRepository.findOne({
        where: {
          id: application.id,
        },
        relations: ['job', 'job.recruiter'],
      })) as Application;

      const { title, description, key } =
        NotificationTypes.NEW_APPLICATION_RECEIVED;

      this.rabbitMqNotificationClient.emit('create-notification', {
        data: {
          title,
          message: description,
          type: key,
        },
        userIds: [application.job.recruiter.id],
      });

      const { id, email, phone_number, address, full_name } =
        application.job.recruiter;

      return {
        ...application,
        job: {
          ...application.job,
          recruiter: {
            id,
            email,
            phone_number,
            address,
            full_name,
          },
        },
      };
    } catch (err) {
      console.error(err);
      throw err;
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
      throw err;
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
      throw err;
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
    updateApplication: UpdateApplication,
  ) => {
    try {
      const { applicationId, resumeFile, coverLetterFile } = updateApplication;

      let application = await this.applicationRepository.findOne({
        where: {
          id: applicationId,
        },
        relations: ['job', 'job.recruiter'],
      });

      if (!application)
        throw new RpcException(
          `Application With ID: '${applicationId}' Not Found.`,
        );

      const files = [resumeFile];

      if (coverLetterFile) {
        files.push(coverLetterFile);
      }

      const [resume, coverLetter] = await lastValueFrom<UrlResponseType[]>(
        this.rabbitMqUploadClient.send({ cmd: 'upload-files' }, files),
      );

      await this.applicationRepository.update(
        { id: applicationId },
        {
          ...(coverLetter && coverLetterFile
            ? { cover_letter_link: coverLetter.url }
            : {}),
          resume_link: resume.url,
        },
      );

      application = (await this.applicationRepository.findOne({
        where: {
          id: application.id,
        },
        relations: ['job', 'job.recruiter'],
      })) as Application;

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

      const { id, email, phone_number, address, full_name } =
        application.job.recruiter;

      return {
        ...application,
        job: {
          ...application.job,
          recruiter: {
            id,
            email,
            phone_number,
            address,
            full_name,
          },
        },
      };
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  public handleProcessApplications = async (
    processApplicationsDto: ProcessApplicationsDto,
  ) => {
    try {
      const { approvedApplicationIds, rejectedApplicationIds } =
        processApplicationsDto;

      const applications: Record<string, Partial<Application>[]> = {};

      if (approvedApplicationIds && approvedApplicationIds.length) {
        applications.approvedApplications = (
          await this.handleGenerateProcessApplications(
            approvedApplicationIds,
            'approved',
          )
        ).map(({ candidate, ...res }) => ({ ...res }));
      }

      if (rejectedApplicationIds && rejectedApplicationIds.length) {
        applications.rejectedApplications = (
          await this.handleGenerateProcessApplications(
            rejectedApplicationIds,
            'rejected',
          )
        ).map(({ candidate, ...res }) => ({ ...res }));
      }

      return applications;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  private handleGenerateProcessApplications = async (
    applicationIds: string[],
    status: string,
  ) => {
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
        {
          id: applicationId,
        },
        {
          status,
        },
      );

      applications.push(
        (await this.applicationRepository.findOneBy({
          id: applicationId,
        })) as Application,
      );

      candidateIds.push(application.candidate.id);
    }

    const { title, description, key } =
      status === 'approved'
        ? NotificationTypes.JOB_APPLICATION_ACCEPTED
        : NotificationTypes.JOB_APPLICATION_REJECTED;

    this.rabbitMqNotificationClient.emit('create-notification', {
      data: {
        title,
        message: description,
        type: key,
      },
      userIds: candidateIds,
    });

    return applications;
  };

  public handleGetApplicationsOfCandidate = async (candidateId: string) => {
    return (
      await this.applicationRepository.find({
        where: {
          candidate: { id: candidateId },
        },
        relations: ['candidate', 'job'],
      })
    ).map(({ candidate, ...res }) => ({ ...res }));
  };
}
