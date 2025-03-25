import { HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { Application } from 'apps/applications/src/entities';
import { Job } from 'apps/jobs/src/entities';
import { User } from 'apps/users/src/entities';
import { ElasticIndexes, NotificationTypes } from 'libs/common/constants';
import {
  ProcessApplicationsDto,
  SearchApplicationsDto,
} from 'libs/common/dtos';
import { TransactionsProvider } from 'libs/common/providers';
import {
  CreateApplication,
  generateRpcExceptionResponse,
  UpdateApplication,
  UrlResponseType,
} from 'libs/common/utils';
import { omit, pick } from 'lodash';
import { lastValueFrom } from 'rxjs';
import { Repository } from 'typeorm';

@Injectable()
export class ApplicationsService implements OnModuleInit {
  constructor(
    @Inject('JOBS_SERVICE') private readonly rabbitMqJobClient: ClientProxy,
    @Inject('NOTIFICATIONS_SERVICE')
    private readonly rabbitMqNotificationClient: ClientProxy,
    @Inject('UPLOADS_SERVICE')
    private readonly rabbitMqUploadClient: ClientProxy,
    @Inject('USERS_SERVICE') private readonly rabbitMqUserClient: ClientProxy,
    private readonly transactionsProvider: TransactionsProvider,
    private readonly elasticsearchService: ElasticsearchService,
    @Inject('REDIS_SERVICE') private readonly rabbitMqRedisClient: ClientProxy,
  ) {}

  async onModuleInit() {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const applicationRepository =
        queryRunner.manager.getRepository(Application);

      return this.handleSyncApplicationsToElasticSearch(applicationRepository);
    });
  }

  public handleCreateApplication = async (
    createApplication: CreateApplication,
  ) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const applicationRepository =
        queryRunner.manager.getRepository(Application);

      const { jobId, resumeFile, coverLetterFile, userId } = createApplication;

      const job = await lastValueFrom<Job | undefined>(
        this.rabbitMqJobClient.send({ cmd: 'verify-job' }, jobId),
      );

      if (!job)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.NOT_FOUND,
            `Job with id: '${jobId}' not found.`,
          ),
        );

      if (
        job.status === 'closed' ||
        job.is_approved === false ||
        new Date(job.expired_at).getTime() < new Date().getTime()
      )
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.BAD_REQUEST,
            `The job with id '${jobId}' has been closed or has expired, so you cannot apply for this job.`,
          ),
        );

      const user = await lastValueFrom<User | null>(
        this.rabbitMqUserClient.send({ cmd: 'get-user-jwt' }, userId),
      );

      if (!user)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.NOT_FOUND,
            `User with id: '${userId}' not found.`,
          ),
        );

      if (!user.application_applied_count)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.TOO_MANY_REQUESTS,
            `You have already applied ${user.application_applied_count} times. No more applications allowed.`,
          ),
        );

      let application = await applicationRepository.findOne({
        where: {
          candidate: { id: userId },
          job: { id: jobId },
        },
        relations: ['candidate', 'job', 'job.recruiter'],
      });

      if (application && application.status !== 'rejected')
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.BAD_REQUEST,
            'You have applied for this position.',
          ),
        );

      const files = [resumeFile];

      if (coverLetterFile) {
        files.push(coverLetterFile);
      }

      const uploadedFiles = await this.uploadFiles(files.filter(Boolean));

      const [resume, coverLetter] = uploadedFiles;

      application = application
        ? await this.updateApplication(
            application.id,
            resume.url,
            coverLetter?.url,
          )
        : await this.createApplication(
            userId,
            jobId,
            resume.url,
            coverLetter?.url,
          );

      this.rabbitMqUserClient.emit('update-user-limit', {
        userId,
        type: 'decrease',
      });

      const { title, description, key } =
        NotificationTypes.NEW_APPLICATION_RECEIVED;

      this.rabbitMqNotificationClient.emit('create-notification', {
        data: { title, message: description, type: key },
        userIds: [application.job.recruiter.id],
      });

      await this.elasticsearchService.index({
        index: ElasticIndexes.APPLICATIONS,
        id: application.id,
        body: {
          ...omit(application, ['createdAt', 'updatedAt']),
          candidate: pick(application.candidate, [
            'id',
            'full_name',
            'email',
            'bio',
            'phone_number',
            'address',
            'certifications',
          ]),
          job: {
            ...pick(application.job, [
              'id',
              'title',
              'description',
              'salary_min',
              'salary_max',
              'job_type',
              'status',
              'address',
            ]),
            recruiter: pick(application.job.recruiter, [
              'id',
              'email',
              'full_name',
              'bio',
              'phone_number',
              'address',
            ]),
          },
        },
      });

      this.rabbitMqRedisClient.emit('del-keys-pattern', 'applications');
      this.rabbitMqRedisClient.emit('del-keys-pattern', 'admin');

      return this.formatApplicationResponse(application);
    });
  };

  public handleGetApplications = async (
    user: User,
    filters?: SearchApplicationsDto,
  ) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      try {
        const { id, role } = user;

        const must: any[] = [];

        if (filters) {
          if (filters.status) {
            must.push({
              match: { status: filters.status },
            });
          }

          if (filters.jobTitle) {
            must.push({
              match: { 'job.title': filters.jobTitle },
            });
          }

          if (filters.appliedAfter || filters.appliedBefore) {
            const rangeFilter: any = { applied_at: {} };

            if (filters.appliedAfter) {
              rangeFilter.applied_at.gte = filters.appliedAfter;
            }
            if (filters.appliedBefore) {
              rangeFilter.applied_at.lte = filters.appliedBefore;
            }

            must.push({ range: rangeFilter });
          }

          if (filters.candidate_email) {
            must.push({
              term: { 'candidate.email.keyword': filters.candidate_email },
            });
          }

          if (filters.candidate_name) {
            must.push({
              wildcard: {
                'candidate.full_name': `*${filters.candidate_name}*`,
              },
            });
          }
        }

        switch (role.name) {
          case 'recruiter':
            must.push({ match: { 'job.recruiter.id': id } });
            break;
          case 'admin':
            break;
          default:
            must.push({ match: { 'candidate.id': id } });
            break;
        }

        const queryBody = {
          query: {
            bool: {
              must,
            },
          },
        };

        const { hits } = await this.elasticsearchService.search({
          index: ElasticIndexes.APPLICATIONS,
          body: queryBody,
        });

        return hits.hits.map((hit) => hit._source);
      } catch (error) {
        if (error?.meta?.statusCode === 404) return [];
        console.error('Elasticsearch search error:', error);
        throw error;
      }
    });
  };

  public handleGetApplication = async (applicationId: string, user: User) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const { _source: application } =
        await this.elasticsearchService.get<Application>({
          index: ElasticIndexes.APPLICATIONS,
          id: applicationId,
        });

      const { role } = user;

      if (!application)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.NOT_FOUND,
            `Application with id: '${applicationId}' not found.`,
          ),
        );

      this.checkApplicationAccess(application, user, 'get');

      if (role.name === 'admin' || role.name === 'recruiter') {
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
    });
  };

  public handleDeleteApplication = async (
    applicationId: string,
    user: User,
  ) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const applicationRepository =
        queryRunner.manager.getRepository(Application);

      const application = await applicationRepository.findOne({
        where: {
          id: applicationId,
        },
        relations: ['job', 'job.recruiter', 'candidate'],
      });

      if (!application)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.NOT_FOUND,
            `Application with id: '${applicationId}' not found.`,
          ),
        );

      this.checkApplicationAccess(application, user, 'delete');

      const { title, description, key } = NotificationTypes.APPLICATION_DELETED;

      this.rabbitMqNotificationClient.emit('create-notification', {
        data: {
          title,
          message: description,
          type: key,
        },
        userIds: [application.job.recruiter.id],
      });

      await this.elasticsearchService.delete({
        index: ElasticIndexes.APPLICATIONS,
        id: applicationId,
      });

      this.rabbitMqRedisClient.emit('del-keys-pattern', 'applications');
      this.rabbitMqRedisClient.emit('del-keys-pattern', 'admin');

      return { success: 'Application deleted successfully!' };
    });
  };

  public handleUpdateApplication = async (
    updateApplication: UpdateApplication,
    user: User,
  ) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const applicationRepository =
        queryRunner.manager.getRepository(Application);

      const { applicationId, resumeFile, coverLetterFile } = updateApplication;

      let application = await applicationRepository.findOne({
        where: {
          id: applicationId,
        },
        relations: ['job', 'job.recruiter', 'candidate'],
      });

      if (!application)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.NOT_FOUND,
            `Application with id: '${applicationId}' not found.`,
          ),
        );

      this.checkApplicationAccess(application, user, 'update');

      const files = [resumeFile];

      if (coverLetterFile) {
        files.push(coverLetterFile);
      }

      const [resume, coverLetter] = await lastValueFrom<UrlResponseType[]>(
        this.rabbitMqUploadClient.send({ cmd: 'upload-files' }, files),
      );

      await applicationRepository.update(
        { id: applicationId },
        {
          ...(coverLetter && coverLetterFile
            ? { cover_letter_link: coverLetter.url }
            : {}),
          resume_link: resume.url,
        },
      );

      application = (await applicationRepository.findOne({
        where: {
          id: application.id,
        },
        relations: ['job', 'job.recruiter', 'candidate'],
        select: {
          id: true,
          resume_link: true,
          cover_letter_link: true,
          status: true,
          applied_at: true,
          candidate: {
            id: true,
            email: true,
            phone_number: true,
            address: true,
            full_name: true,
            bio: true,
            certifications: true,
          },
          job: {
            id: true,
            title: true,
            description: true,
            job_type: true,
            address: true,
            status: true,
            posted_at: true,
            salary_max: true,
            salary_min: true,
            recruiter: {
              id: true,
              email: true,
              phone_number: true,
              address: true,
              full_name: true,
              bio: true,
              company: {
                name: true,
              },
            },
          },
        },
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

      const {
        id,
        resume_link,
        cover_letter_link,
        status,
        applied_at,
        candidate,
        job,
      } = application;

      await this.elasticsearchService.index({
        index: ElasticIndexes.APPLICATIONS,
        id: application.id,
        body: {
          id,
          resume_link,
          cover_letter_link,
          status,
          applied_at,
          candidate: pick(candidate, [
            'id',
            'email',
            'full_name',
            'bio',
            'phone_number',
            'address',
            'certifications',
          ]),
          job: {
            ...pick(job, [
              'id',
              'title',
              'description',
              'salary_min',
              'salary_max',
              'job_type',
              'status',
              'address',
              'posted_at',
            ]),
            recruiter: pick(job.recruiter, [
              'id',
              'email',
              'full_name',
              'bio',
              'phone_number',
              'address',
            ]),
          },
        },
      });

      this.rabbitMqRedisClient.emit('del-keys-pattern', 'applications');

      return application;
    });
  };

  public handleProcessApplications = async (
    processApplicationsDto: ProcessApplicationsDto,
    user: User,
  ) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const applications: Record<string, Partial<Application>[]> = {};

      const approvedApplicationIds =
        processApplicationsDto?.approvedApplicationIds ?? [];

      const rejectedApplicationIds =
        processApplicationsDto?.rejectedApplicationIds ?? [];

      if (approvedApplicationIds.length) {
        applications.approvedApplications =
          await this.handleGenerateProcessApplications(
            approvedApplicationIds,
            'approved',
            user,
          );
      }

      if (rejectedApplicationIds?.length) {
        applications.rejectedApplications =
          await this.handleGenerateProcessApplications(
            rejectedApplicationIds,
            'rejected',
            user,
          );
      }

      this.rabbitMqRedisClient.emit('del-keys-pattern', 'applications');
      this.rabbitMqRedisClient.emit('del-keys-patter', 'admin');

      return applications;
    });
  };

  private handleGenerateProcessApplications = async (
    applicationIds: string[],
    status: string,
    user: User,
  ) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const applicationRepository =
        queryRunner.manager.getRepository(Application);

      const applications: Application[] = [];

      const candidateIds: string[] = [];

      for (const applicationId of applicationIds) {
        const application = await applicationRepository.findOne({
          where: {
            id: applicationId,
          },
          relations: ['candidate', 'job', 'job.recruiter'],
        });

        if (!application)
          throw new RpcException(
            generateRpcExceptionResponse(
              HttpStatus.NOT_FOUND,
              `Application with id: '${applicationId}' not found.`,
            ),
          );

        if (application.status === 'rejected' && status === 'rejected') {
          console.warn(
            `Application with id: '${applicationId}' has already been rejected and cannot be rejected again.'`,
          );
          continue;
        }

        if (application.status === 'approved' && status === 'approved') {
          console.warn(
            `Application with id: '${applicationId}' has already been approved and cannot be approved again.'`,
          );
          continue;
        }

        this.checkApplicationAccess(
          application,
          user,
          status === 'approved' ? 'approve' : 'reject',
        );

        await applicationRepository.update(
          {
            id: applicationId,
          },
          {
            status,
          },
        );

        applications.push(
          (await applicationRepository.findOne({
            where: {
              id: applicationId,
            },
            relations: ['candidate', 'job'],
            select: {
              id: true,
              resume_link: true,
              cover_letter_link: true,
              status: true,
              applied_at: true,
              candidate: {
                id: true,
                email: true,
                phone_number: true,
                address: true,
                full_name: true,
                bio: true,
                certifications: true,
              },
              job: {
                id: true,
                title: true,
                description: true,
                job_type: true,
                address: true,
                status: true,
                posted_at: true,
                salary_max: true,
                salary_min: true,
                recruiter: {
                  id: true,
                  email: true,
                  phone_number: true,
                  address: true,
                  full_name: true,
                  bio: true,
                  company: {
                    name: true,
                  },
                },
              },
            },
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
          metadata: {
            applications,
          },
        },
        userIds: candidateIds,
      });

      if (status === 'rejected') {
        for (const candidateId of candidateIds) {
          this.rabbitMqUserClient.emit('update-user-limit', {
            userId: candidateId,
            type: 'increase',
          });
        }
      }

      return applications;
    });
  };

  private checkApplicationAccess(
    application: Application,
    user: User,
    action: 'get' | 'delete' | 'update' | 'approve' | 'reject',
  ) {
    const { role, id } = user;

    if (application.candidate.id !== id && role.name === 'user') {
      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.BAD_REQUEST,
          `You are only allowed to ${action} your own application.`,
        ),
      );
    }

    if (application.job.recruiter.id !== id && role.name === 'recruiter') {
      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.BAD_REQUEST,
          `You can only ${action} applications for jobs you have posted.`,
        ),
      );
    }
  }

  public handleDeleteUserFromApplication = async (
    userId: string,
    applicationId: string,
  ) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const applicationRepository =
        queryRunner.manager.getRepository(Application);

      const existingUser = await applicationRepository.find({
        where: {
          candidate: {
            id: userId,
          },
        },
        relations: ['candidate'],
      });

      if (!existingUser || !existingUser.length)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.FORBIDDEN,
            `The candidate with id '${userId}' has not applied for jobs you posted.`,
          ),
        );

      await applicationRepository.delete({
        candidate: {
          id: userId,
        },
      });

      const { title, description, key } = NotificationTypes.CANDIDATE_REMOVED;

      this.rabbitMqNotificationClient.emit('create-notification', {
        data: {
          title,
          message: description,
          type: key,
        },
        userIds: [userId],
        metadata: {
          applications: [
            (await applicationRepository.findOne({
              where: {
                id: applicationId,
              },
              relations: ['job'],
            })) as Application,
          ],
        },
      });

      return {
        success: `The candidate with id: '${userId}' has been deleted from jobs that you posted.`,
      };
    });
  };

  private uploadFiles = async (files: Array<Express.Multer.File>) => {
    return lastValueFrom<UrlResponseType[]>(
      this.rabbitMqUploadClient.send({ cmd: 'upload-files' }, files),
    );
  };

  private updateApplication = async (
    applicationId: string,
    resumeUrl: string,
    coverLetterUrl?: string,
  ) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const applicationRepository =
        queryRunner.manager.getRepository(Application);

      await applicationRepository.update(
        {
          id: applicationId,
        },
        {
          status: 'pending',
          resume_link: resumeUrl,
          ...(coverLetterUrl ? { cover_letter_link: coverLetterUrl } : {}),
        },
      );

      return applicationRepository.findOne({
        where: {
          id: applicationId,
        },
        relations: ['job', 'job.recruiter'],
      }) as Promise<Application>;
    });
  };

  private createApplication = async (
    userId: string,
    jobId: string,
    resumeUrl: string,
    coverLetterUrl?: string,
  ) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const applicationRepository =
        queryRunner.manager.getRepository(Application);

      const application = applicationRepository.create({
        resume_link: resumeUrl,
        ...(coverLetterUrl ? { cover_letter_link: coverLetterUrl } : {}),
        applied_at: new Date(),
      });

      await applicationRepository.save(application);

      await Promise.all([
        await applicationRepository
          .createQueryBuilder()
          .relation(Application, 'candidate')
          .of(application.id)
          .set(userId),
        await applicationRepository
          .createQueryBuilder()
          .relation(Application, 'job')
          .of(application.id)
          .set(jobId),
      ]);

      const newApplication = (await applicationRepository.findOne({
        where: {
          id: application.id,
        },
        relations: ['job', 'job.recruiter'],
      })) as Application;

      this.rabbitMqRedisClient.emit('del-keys-pattern', 'applications');

      return newApplication;
    });
  };

  private formatApplicationResponse = (application: Application) => {
    const { id, email, phone_number, address, full_name } =
      application.job.recruiter;

    const { candidate, ...res } = application;

    return {
      ...res,
      job: {
        ...application.job,
        recruiter: { id, email, phone_number, address, full_name },
      },
    };
  };

  private handleSyncApplicationsToElasticSearch = async (
    applicationRepository: Repository<Application>,
  ) => {
    const applications = await applicationRepository
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.candidate', 'candidate')
      .leftJoinAndSelect('application.job', 'job')
      .leftJoinAndSelect('job.recruiter', 'recruiter')
      .orderBy('application.createdAt')
      .getMany();

    const bulkBody = applications.flatMap(
      ({
        id,
        resume_link,
        cover_letter_link,
        status,
        applied_at,
        candidate,
        job,
      }) => [
        { index: { _index: ElasticIndexes.APPLICATIONS, _id: id } },
        {
          id,
          resume_link,
          cover_letter_link,
          status,
          applied_at,
          candidate: candidate
            ? pick(candidate, [
                'id',
                'email',
                'full_name',
                'bio',
                'phone_number',
                'address',
                'certifications',
              ])
            : null,
          job: job
            ? {
                ...pick(job, [
                  'id',
                  'title',
                  'description',
                  'salary_min',
                  'salary_max',
                  'job_type',
                  'status',
                  'address',
                  'posted_at',
                ]),
                recruiter: job.recruiter
                  ? pick(job.recruiter, [
                      'id',
                      'email',
                      'full_name',
                      'bio',
                      'phone_number',
                      'address',
                    ])
                  : null,
              }
            : null,
        },
      ],
    );

    if (!bulkBody.length) {
      console.warn(
        '⚠️ Bulk request body is empty, skipping Elasticsearch sync.',
      );
      return;
    }

    await this.elasticsearchService.bulk({
      index: ElasticIndexes.APPLICATIONS,
      body: bulkBody,
    });
  };

  public handleCalculateStatisticsOfApplications = async () => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const applicationRepository =
        queryRunner.manager.getRepository(Application);

      const [
        totalApplications,
        approvedApplications,
        rejectedApplications,
        pendingApplications,
      ] = await Promise.all([
        applicationRepository.count(),
        applicationRepository.count({ where: { status: 'approved' } }),
        applicationRepository.count({ where: { status: 'rejected' } }),
        applicationRepository.count({ where: { status: 'pending' } }),
      ]);

      return {
        totalApplications,
        approvedApplications,
        rejectedApplications,
        pendingApplications,
      };
    });
  };
}
