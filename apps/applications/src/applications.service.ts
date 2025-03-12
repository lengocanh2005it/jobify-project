import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Application } from 'apps/applications/src/entities';
import { Job } from 'apps/jobs/src/entities';
import { User } from 'apps/users/src/entities';
import { NotificationTypes } from 'libs/common/constants';
import {
  ProcessApplicationsDto,
  SearchApplicationsDto,
} from 'libs/common/dtos';
import {
  CreateApplication,
  generateRpcExceptionResponse,
  UpdateApplication,
  UrlResponseType,
} from 'libs/common/utils';
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
    @Inject('USERS_SERVICE') private readonly rabbitMqUserClient: ClientProxy,
  ) {}

  public handleCreateApplication = async (
    createApplication: CreateApplication,
  ) => {
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

    let application = await this.applicationRepository.findOne({
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

    return this.formatApplicationResponse(application);
  };

  public handleGetApplications = async (
    user: User,
    filters?: SearchApplicationsDto,
  ) => {
    const { id, role } = user;

    const query = this.applicationRepository
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.candidate', 'candidate')
      .leftJoinAndSelect('application.job', 'job')
      .leftJoinAndSelect('job.recruiter', 'recruiter')
      .select([
        'application.id',
        'application.resume_link',
        'application.cover_letter_link',
        'application.status',
        'application.applied_at',
        'candidate.id',
        'candidate.email',
        'candidate.full_name',
        'candidate.bio',
        'candidate.phone_number',
        'candidate.address',
        'candidate.certifications',
        'job.id',
        'job.title',
        'job.description',
        'job.salary_min',
        'job.salary_max',
        'job.job_type',
        'job.status',
        'job.address',
        'recruiter.id',
        'recruiter.email',
        'recruiter.full_name',
        'recruiter.bio',
        'recruiter.phone_number',
        'recruiter.address',
      ]);

    if (role.name === 'recruiter') {
      query.andWhere('job.recruiter.id = :id', { id });
    } else if (role.name !== 'admin') {
      query.andWhere('candidate.id = :id', { id });
    }

    if (filters?.status) {
      query.andWhere('application.status = :status', {
        status: filters.status,
      });
    }

    if (filters?.jobTitle) {
      query.andWhere('LOWER(job.title) LIKE LOWER(:jobTitle)', {
        jobTitle: `%${filters.jobTitle}%`,
      });
    }

    if (filters?.appliedAfter) {
      const appliedAfterDate = new Date(
        `${filters.appliedAfter}T00:00:00.000Z`,
      );

      query.andWhere('application.applied_at >= :appliedAfter', {
        appliedAfter: appliedAfterDate,
      });
    }

    if (filters?.appliedBefore) {
      const appliedBeforeDate = new Date(
        `${filters.appliedBefore}T00:00:00.000Z`,
      );

      query.andWhere('application.applied_at <= :appliedBefore', {
        appliedBefore: appliedBeforeDate,
      });
    }

    if (filters?.candidate_email) {
      query.andWhere('candidate.email = :candidate_email', {
        candidate_email: filters.candidate_email,
      });
    }

    if (filters?.candidate_name) {
      query.andWhere('LOWER(candidate.full_name) LIKE LOWER(:candidate_name)', {
        candidate_name: `%${filters.candidate_name}%`,
      });
    }

    return await query.getMany();
  };

  public handleGetApplication = async (applicationId: string, user: User) => {
    const { role } = user;

    const application = await this.applicationRepository.findOne({
      where: {
        id: applicationId,
      },
      relations: ['candidate', 'job', 'job.recruiter', 'job.recruiter.company'],
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
    });

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
  };

  public handleDeleteApplication = async (
    applicationId: string,
    user: User,
  ) => {
    const application = await this.applicationRepository.findOne({
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

    return { success: 'Application deleted successfully!' };
  };

  public handleUpdateApplication = async (
    updateApplication: UpdateApplication,
    user: User,
  ) => {
    const { applicationId, resumeFile, coverLetterFile } = updateApplication;

    let application = await this.applicationRepository.findOne({
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

    return application;
  };

  public handleProcessApplications = async (
    processApplicationsDto: ProcessApplicationsDto,
    user: User,
  ) => {
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

    return applications;
  };

  private handleGenerateProcessApplications = async (
    applicationIds: string[],
    status: string,
    user: User,
  ) => {
    const applications: Application[] = [];
    const candidateIds: string[] = [];

    for (const applicationId of applicationIds) {
      const application = await this.applicationRepository.findOne({
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

      await this.applicationRepository.update(
        {
          id: applicationId,
        },
        {
          status,
        },
      );

      applications.push(
        (await this.applicationRepository.findOne({
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

  public handleDeleteUserFromApplication = async (userId: string) => {
    const existingUser = await this.applicationRepository.find({
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
          `Candidate with id '${userId}' has not applied for jobs you posted.`,
        ),
      );

    await this.applicationRepository.delete({
      candidate: {
        id: userId,
      },
    });

    return {
      success: 'This candidate has been deleted from jobs that you posted.',
    };
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
    await this.applicationRepository.update(
      {
        id: applicationId,
      },
      {
        status: 'pending',
        resume_link: resumeUrl,
        ...(coverLetterUrl ? { cover_letter_link: coverLetterUrl } : {}),
      },
    );

    return this.applicationRepository.findOne({
      where: {
        id: applicationId,
      },
      relations: ['job', 'job.recruiter'],
    }) as Promise<Application>;
  };

  private createApplication = async (
    userId: string,
    jobId: string,
    resumeUrl: string,
    coverLetterUrl?: string,
  ) => {
    const application = this.applicationRepository.create({
      resume_link: resumeUrl,
      ...(coverLetterUrl ? { cover_letter_link: coverLetterUrl } : {}),
      applied_at: new Date(),
    });

    await this.applicationRepository.save(application);

    await Promise.all([
      this.dataSource
        .createQueryBuilder()
        .relation(Application, 'candidate')
        .of(application.id)
        .set(userId),
      this.dataSource
        .createQueryBuilder()
        .relation(Application, 'job')
        .of(application.id)
        .set(jobId),
    ]);

    return this.applicationRepository.findOne({
      where: {
        id: application.id,
      },
      relations: ['job', 'job.recruiter'],
    }) as Promise<Application>;
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
}
