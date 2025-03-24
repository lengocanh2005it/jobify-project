import {
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { Cron } from '@nestjs/schedule';
import { Company, Job, Requirement, SavedJob } from 'apps/jobs/src/entities';
import { User } from 'apps/users/src/entities';
import { subDays } from 'date-fns';
import { ElasticIndexes, NotificationTypes, Role } from 'libs/common/constants';
import {
  CreateCompanyDto,
  CreateJobDto,
  DeleteJobDto,
  ProcessJobsDto,
  RemoveSavedJobsDto,
  SearchJobsDto,
  UpdateCompanyDto,
  UpdateJobDto,
} from 'libs/common/dtos';
import { TransactionsProvider } from 'libs/common/providers';
import { generateRpcExceptionResponse } from 'libs/common/utils';
import { omit, pick } from 'lodash';
import { lastValueFrom } from 'rxjs';
import { LessThan, MoreThan, Repository } from 'typeorm';

@Injectable()
export class JobsService implements OnModuleInit {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    @Inject('NOTIFICATIONS_SERVICE')
    private readonly rabbitMqNotificationClient: ClientProxy,
    @Inject('USERS_SERVICE') private readonly rabbitMqUserClient: ClientProxy,
    private readonly transactionsProvider: TransactionsProvider,
    private readonly elasticsearchService: ElasticsearchService,
  ) {}

  async onModuleInit() {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const jobRepository = queryRunner.manager.getRepository(Job);
      return this.handleSyncJobsToElasticSearch(jobRepository);
    });
  }

  @Cron('0 0 * * *')
  async handleUpdateExpiredJobs() {
    const now = new Date();

    await this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const jobRepository = queryRunner.manager.getRepository(Job);

      const expiredJobs = await jobRepository.find({
        where: {
          status: 'open',
          expired_at: LessThan(now),
        },
        relations: ['recruiter'],
      });

      if (!expiredJobs.length) {
        this.logger.log('No expired jobs to update.');
        return;
      }

      const recruiterIds: string[] = [];

      for (const job of expiredJobs) {
        job.status = 'closed';

        await jobRepository.save(job);

        recruiterIds.push(job.recruiter.id);

        this.logger.log(
          `Job with id '${job.id}' has been closed due to expiration.`,
        );
      }

      const { title, description, key } = NotificationTypes.JOB_EXPIRED;

      this.rabbitMqNotificationClient.emit('create-notification', {
        data: {
          title,
          message: description,
          type: key,
        },
        userIds: recruiterIds,
      });
    });
    this.logger.log('Expired jobs update process completed.');
  }

  public handleCreateCompany = async (
    userId: string,
    createCompanyDto: CreateCompanyDto,
  ): Promise<any> => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const companyRepository = queryRunner.manager.getRepository(Company);

      const { name } = createCompanyDto;

      let company: Company | null;

      company = await companyRepository.findOneBy({ name });

      if (!company) {
        company = companyRepository.create(createCompanyDto);

        await companyRepository.save(company);
      }

      await companyRepository
        .createQueryBuilder()
        .relation(Company, 'recruiters')
        .of(company.id)
        .add(userId);

      const { recruiters, ...res } = (await companyRepository.findOne({
        where: { id: company.id },
        relations: ['recruiters'],
      })) as Company;

      return {
        ...res,
        recruiters: recruiters.map((recruiter) =>
          omit(recruiter, ['password']),
        ),
      };
    });
  };

  public handleCreateJob = async (createJobDto: CreateJobDto, user: User) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const jobRepository = queryRunner.manager.getRepository(Job);

      const requirementRepository =
        queryRunner.manager.getRepository(Requirement);

      const { role, id, job_posted_count } = user;

      let recruiterId = id;

      if (role.name === 'admin') {
        const { recruiter_id } = createJobDto;

        if (!recruiter_id)
          throw new RpcException(
            generateRpcExceptionResponse(
              HttpStatus.BAD_REQUEST,
              'Admin must specify a recruiter_id in CreateJobDto.',
            ),
          );

        recruiterId = recruiter_id;
      }

      if (role.name === 'recruiter' && !job_posted_count)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.TOO_MANY_REQUESTS,
            `You have exhausted your job posting limit. Please wait until it resets or contact support.`,
          ),
        );

      const { posted_at, expired_at, title, description } = createJobDto;

      const { requirements, ...resCreateJobDto } = createJobDto;

      const now = new Date();

      const postedDate = new Date(posted_at);

      const expiredDate = new Date(expired_at);

      if (now.getTime() > postedDate.getTime())
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.BAD_REQUEST,
            'Posted date must be greater than or equal to current date.',
          ),
        );

      if (postedDate.getTime() > expiredDate.getTime())
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.BAD_REQUEST,
            'Expired date must be greater than posted date.',
          ),
        );

      const existingJob = await jobRepository.findOne({
        where: { title, description, recruiter: { id: recruiterId } },
        relations: ['recruiter'],
      });

      if (existingJob)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.BAD_REQUEST,
            `This job has been posted by ${role.name === 'admin' ? `recruiter with id '${recruiterId}'` : 'you'}`,
          ),
        );

      const newJob = jobRepository.create(resCreateJobDto);

      await jobRepository.save(newJob);

      if (requirements && requirements.length) {
        for (const requirement of requirements) {
          let newRequirement = await requirementRepository.findOneBy({
            requirement,
          });

          if (!newRequirement) {
            newRequirement = requirementRepository.create({ requirement });

            await requirementRepository.save(newRequirement);
          }

          await jobRepository
            .createQueryBuilder()
            .relation(Job, 'requirements')
            .of(newJob.id)
            .add(newRequirement.id);
        }
      }

      await jobRepository
        .createQueryBuilder()
        .relation(Job, 'recruiter')
        .of(newJob.id)
        .set(recruiterId);

      const relations = ['requirements'];

      if (user.role.name === 'admin') {
        relations.push('recruiter', 'recruiter.company');
      }

      const savedJob = (await jobRepository.findOne({
        where: { id: newJob.id },
        relations,
      })) as Job;

      const { full_name, email, phone_number, company } =
        role.name === 'recruiter' ? user : savedJob.recruiter;

      await this.elasticsearchService.index({
        index: ElasticIndexes.JOBS,
        id: savedJob.id,
        body: {
          ...pick(savedJob, [
            'id',
            'title',
            'address',
            'job_type',
            'salary_min',
            'salary_max',
            'posted_at',
            'expired_at',
            'description',
          ]),
          recruiter: savedJob.recruiter
            ? {
                id: savedJob.recruiter.id,
                full_name,
                email,
                phone_number,
                company: company?.name || null,
              }
            : null,
          requirements: savedJob.requirements.map((r) => r.requirement),
        },
      });

      return {
        ...savedJob,
        ...(user.role.name === 'admin' && {
          recruiter: omit(savedJob.recruiter, ['password']),
        }),
        requirements: savedJob.requirements.map((r) => r.requirement),
      };
    });
  };

  public handleProcessJobs = async (processJobsDto: ProcessJobsDto) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const jobRepository = queryRunner.manager.getRepository(Job);

      const { approvedJobIds, rejectedJobs } = processJobsDto;

      if (!approvedJobIds && !rejectedJobs)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.BAD_REQUEST,
            'You must be provide the information of processing the jobs.',
          ),
        );

      const jobs: Record<string, Job[]> = {};

      if (approvedJobIds && approvedJobIds.length) {
        jobs.approved_jobs = [];

        for (const jobId of approvedJobIds) {
          const job = await jobRepository.findOneBy({ id: jobId });

          if (!job)
            throw new RpcException(
              generateRpcExceptionResponse(
                HttpStatus.NOT_FOUND,
                `Job with id: '${jobId}' not found.`,
              ),
            );

          if (
            job.is_approved === true ||
            (job.is_approved === false && job.cancel_reason && job.cancelled_by)
          )
            throw new RpcException(
              generateRpcExceptionResponse(
                HttpStatus.BAD_REQUEST,
                `Job with id: '${jobId}' has already been processed and cannot be processed again.`,
              ),
            );

          await jobRepository.update(
            {
              id: jobId,
            },
            {
              is_approved: true,
            },
          );

          jobs.approved_jobs.push(
            (await jobRepository.findOne({
              where: { id: jobId },
              relations: ['requirements', 'recruiter'],
              select: {
                id: true,
                title: true,
                address: true,
                job_type: true,
                salary_min: true,
                salary_max: true,
                description: true,
                status: true,
                posted_at: true,
                expired_at: true,
                is_approved: true,
                cancel_reason: true,
                cancelled_by: true,
                recruiter: {
                  id: true,
                  full_name: true,
                  email: true,
                  phone_number: true,
                },
              },
            })) as Job,
          );
        }

        const {
          title: approvedTitle,
          description: approvedDescription,
          key: approvedKey,
        } = NotificationTypes.JOB_APPROVED;

        this.rabbitMqNotificationClient.emit('create-notification', {
          data: {
            title: approvedTitle,
            message: approvedDescription,
            type: approvedKey,
          },
          userIds: jobs.approved_jobs.map((j) => j.recruiter.id),
        });

        const { title, description, key } = NotificationTypes.RECOMMENDED_JOB;

        for (const job of jobs.approved_jobs) {
          const requirements = job.requirements.map((re) => re.requirement);

          const matchedUsers = await lastValueFrom<User[]>(
            this.rabbitMqUserClient.send(
              { cmd: 'get-users-matched-requirements' },
              requirements,
            ),
          );

          if (matchedUsers && matchedUsers.length) {
            this.rabbitMqNotificationClient.emit('create-notification', {
              data: {
                title,
                message: description,
                type: key,
                metadata: {
                  jobId: job.id,
                },
              },
              userIds: matchedUsers.map((user) => user.id),
            });
          }
        }
      }

      if (rejectedJobs && rejectedJobs.length) {
        jobs.rejected_jobs = [];

        for (const rejectedJob of rejectedJobs) {
          const job = await jobRepository.findOneBy({
            id: rejectedJob.job_id,
          });

          if (!job)
            throw new RpcException(
              generateRpcExceptionResponse(
                HttpStatus.NOT_FOUND,
                `Job with id: '${rejectedJob.job_id}' not found.`,
              ),
            );

          if (
            job.is_approved === true ||
            (job.is_approved === false && job.cancel_reason && job.cancelled_by)
          )
            throw new RpcException(
              generateRpcExceptionResponse(
                HttpStatus.BAD_REQUEST,
                `Job with id: '${rejectedJob.job_id}' has already been processed and cannot be processed again.`,
              ),
            );

          await jobRepository.update(
            {
              id: rejectedJob.job_id,
            },
            {
              is_approved: false,
              cancel_reason: rejectedJob.reason,
              cancelled_by: Role.ADMIN,
            },
          );

          jobs.rejected_jobs.push(
            (await jobRepository.findOne({
              where: { id: rejectedJob.job_id },
              relations: ['recruiter'],
              select: {
                id: true,
                title: true,
                address: true,
                job_type: true,
                salary_min: true,
                salary_max: true,
                description: true,
                status: true,
                posted_at: true,
                expired_at: true,
                is_approved: true,
                cancel_reason: true,
                cancelled_by: true,
                recruiter: {
                  id: true,
                  full_name: true,
                  email: true,
                  phone_number: true,
                },
                applications: false,
              },
            })) as Job,
          );
        }

        const {
          title: approvedTitle,
          description: approvedDescription,
          key: approvedKey,
        } = NotificationTypes.JOB_REJECTED;

        this.rabbitMqNotificationClient.emit('create-notification', {
          data: {
            title: approvedTitle,
            message: approvedDescription,
            type: approvedKey,
          },
          userIds: jobs.rejected_jobs.map((j) => j.recruiter.id),
        });
      }

      return { jobs };
    });
  };

  public handleGetJobs = async (user: User, filters?: SearchJobsDto) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      try {
        const must: any[] = [];

        if (filters) {
          if (filters.title) {
            must.push({
              match: { title: filters.title },
            });
          }

          if (filters.postedAfter || filters.postedBefore) {
            const rangeFilter: any = { posted_at: {} };

            if (filters.postedAfter) {
              rangeFilter.posted_at.gte = filters.postedAfter;
            }
            if (filters.postedBefore) {
              rangeFilter.posted_at.lte = filters.postedBefore;
            }

            must.push({ range: rangeFilter });
          }

          if (filters.expiredAfter || filters.expiredBefore) {
            const rangeFilter: any = { expired_at: {} };

            if (filters.expiredAfter) {
              rangeFilter.expired_at.gte = filters.expiredAfter;
            }
            if (filters.expiredBefore) {
              rangeFilter.expired_at.lte = filters.expiredBefore;
            }

            must.push({ range: rangeFilter });
          }

          if (filters.address) {
            must.push({
              match: {
                address: {
                  query: filters.address,
                  fuzziness: 'AUTO',
                },
              },
            });
          }

          if (filters.job_type) {
            must.push({
              match: { job_type: filters.job_type },
            });
          }

          if (filters.salary_min) {
            must.push({
              range: { salary_min: { gte: filters.salary_min } },
            });
          }

          if (filters.salary_max) {
            must.push({
              range: { salary_max: { lte: filters.salary_max } },
            });
          }
        }

        const queryBody = {
          query: {
            bool: {
              must: [
                ...(user.role.name === 'recruiter'
                  ? [{ match: { 'recruiter.company': user.company.name } }]
                  : []),
                ...must,
              ],
            },
          },
        };

        const { hits } = await this.elasticsearchService.search({
          index: ElasticIndexes.JOBS,
          body: queryBody,
        });

        return hits.hits.map((hit) => hit._source);
      } catch (error) {
        if (error?.meta?.statusCode === 404) return [];
        console.error('Elasticsearch search error: ', error);
        throw error;
      }
    });
  };

  public handleDeleteJob = async (
    jobId: string,
    user: User,
    query?: DeleteJobDto,
  ) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const jobRepository = queryRunner.manager.getRepository(Job);

      const job = await jobRepository.findOne({
        where: {
          id: jobId,
        },
        relations: ['recruiter'],
      });

      if (!job)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.NOT_FOUND,
            `Job with id: '${jobId}' not found.`,
          ),
        );

      const { id, role } = user;

      if (role.name === 'admin' && !query?.recruiter_id)
        throw new RpcException(
          `You must be provide the recruiter_id to delete their jobs.`,
        );

      if (job.recruiter.id !== id && role.name === 'recruiter')
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.FORBIDDEN,
            `You can only delete job that you posted.`,
          ),
        );

      const jobWithRequirements = await jobRepository.findOne({
        where: {
          id: jobId,
        },
        relations: ['requirements'],
      });

      if (
        jobWithRequirements?.requirements &&
        jobWithRequirements.requirements.length
      ) {
        await jobRepository
          .createQueryBuilder()
          .relation(Job, 'requirements')
          .of(job.id)
          .remove(jobWithRequirements.requirements.map((re) => re.id));
      }

      await this.elasticsearchService.delete({
        index: ElasticIndexes.JOBS,
        id: jobId,
      });

      await jobRepository.delete({ id: jobId });

      return (
        await jobRepository.find({
          relations: ['requirements'],
          where: {
            recruiter: {
              id: role.name === 'admin' ? query?.recruiter_id : id,
            },
          },
          select: {
            id: true,
            title: true,
            address: true,
            job_type: true,
            salary_min: true,
            salary_max: true,
            description: true,
            status: true,
            posted_at: true,
            expired_at: true,
            is_approved: true,
            cancel_reason: true,
            cancelled_by: true,
            createdAt: true,
            requirements: {
              requirement: true,
            },
          },
        })
      ).map((job) => ({
        ...job,
        requirements: job.requirements.map((re) => re.requirement),
      }));
    });
  };

  public handleUpdateJob = async (
    updateJobDto: UpdateJobDto,
    jobId: string,
    user: User,
  ) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const jobRepository = queryRunner.manager.getRepository(Job);

      const requirementRepository =
        queryRunner.manager.getRepository(Requirement);

      if (!Object.keys(updateJobDto).length)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.BAD_REQUEST,
            'You must be provide some information to update the job.',
          ),
        );

      let job = await jobRepository.findOne({
        where: {
          id: jobId,
        },
        relations: ['recruiter', 'requirements'],
      });

      if (!job)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.NOT_FOUND,
            `Job with id: '${jobId}' not found.`,
          ),
        );

      const { role, id } = user;

      if (job.recruiter.id !== id && role.name === 'recruiter')
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.FORBIDDEN,
            'You can only update the job that you have posted.',
          ),
        );

      const { requirements, ...res } = updateJobDto;

      if (
        res.expired_at &&
        new Date(res.expired_at).getTime() < new Date().getTime()
      )
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.BAD_REQUEST,
            'The expiration time of the job must be greater than the current date.',
          ),
        );

      if (res.status === job.status)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.BAD_REQUEST,
            `You cannot update the job's status to the same status it initially had.`,
          ),
        );

      await jobRepository.update(
        { id: jobId },
        {
          ...res,
          is_approved: false,
        },
      );
      if (requirements && requirements.length) {
        const jobRequirements = new Set<{ requirement: string; id: string }>(
          (
            await jobRepository
              .createQueryBuilder('job')
              .relation(Job, 'requirements')
              .of(job.id)
              .loadMany<Requirement>()
          ).map((re) => ({ requirement: re.requirement, id: re.id })),
        );

        const excludeRequirements = Array.from(jobRequirements).filter(
          (re) => !new Set<string>(requirements).has(re.requirement),
        );

        const newRequirements = requirements.filter(
          (re) =>
            !Array.from(jobRequirements)
              .map((el) => el.requirement)
              .includes(re),
        );

        if (excludeRequirements && excludeRequirements.length) {
          await jobRepository
            .createQueryBuilder()
            .relation(Job, 'requirements')
            .of(job.id)
            .remove(excludeRequirements.map((re) => re.id));
        }

        if (newRequirements && newRequirements.length) {
          for (const requirement of newRequirements) {
            let newRequirement = await requirementRepository.findOne({
              where: {
                requirement,
              },
            });

            if (!newRequirement) {
              newRequirement = requirementRepository.create({
                requirement,
              });

              await requirementRepository.save(newRequirement);
            }

            job.requirements.push(newRequirement);

            await jobRepository.save(job);
          }
        }
      }

      const relations = ['requirements'];

      if (user.role.name === 'admin') {
        relations.push('recruiter');
      }

      job = (await jobRepository.findOne({
        where: { id: jobId },
        relations,
      })) as Job;

      await this.elasticsearchService.index({
        index: ElasticIndexes.JOBS,
        id: job.id,
        body: {
          id: job.id,
          title: job.title,
          address: job.address,
          job_type: job.job_type,
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          posted_at: job.posted_at,
          expired_at: job.expired_at,
          recruiter: job.recruiter
            ? {
                id: job.recruiter.id,
                full_name: job.recruiter.full_name,
                email: job.recruiter.email,
                phone_number: job.recruiter.phone_number,
                company: job.recruiter.company?.name || null,
              }
            : null,
          requirements: job.requirements.map((r) => r.requirement),
        },
      });

      return {
        ...job,
        ...(user.role.name === 'admin' && {
          recruiter: omit(job.recruiter, ['password']),
        }),
        requirements: job.requirements.map((re) => re.requirement),
      };
    });
  };

  public handleGetJob = async (jobId: string, user: User) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const jobRepository = queryRunner.manager.getRepository(Job);

      const job = await jobRepository.findOne({
        where: {
          id: jobId,
        },
        relations: ['applications', 'recruiter', 'applications.candidate'],
      });

      if (!job)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.NOT_FOUND,
            `Job with id: '${jobId}' not found.`,
          ),
        );

      const { id, role } = user;

      if (job.recruiter.id !== id && role.name === 'recruiter')
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.FORBIDDEN,
            `You can only get a job that you have posted.`,
          ),
        );

      if (
        !job.applications.some((app) => app.candidate.id === id) &&
        role.name === 'candidate'
      )
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.FORBIDDEN,
            'You can only get a job that you have applied for.',
          ),
        );

      return job;
    });
  };

  public handleGetCompany = async (companyId: string) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const companyRepository = queryRunner.manager.getRepository(Company);

      const company = await companyRepository.findOne({
        where: { id: companyId },
        relations: ['recruiters'],
      });

      if (!company)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.NOT_FOUND,
            `Company with id: '${companyId}' not found.`,
          ),
        );

      return {
        ...company,
        recruiters: company.recruiters.map((re) => omit(re, ['password'])),
      };
    });
  };

  public handleSavedJobs = async (jobIds: string[], user: User) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const jobRepository = queryRunner.manager.getRepository(Job);
      const savedJobRepository = queryRunner.manager.getRepository(SavedJob);

      const savedJobs: Job[] = [];

      for (const jobId of jobIds) {
        const job = await jobRepository.findOneBy({ id: jobId });

        if (!job)
          throw new RpcException(
            generateRpcExceptionResponse(
              HttpStatus.NOT_FOUND,
              `Job with id: '${jobId}' not found.`,
            ),
          );

        if (
          await savedJobRepository.findOne({
            where: {
              user: {
                id: user.id,
              },
              job: {
                id: jobId,
              },
            },
          })
        )
          throw new RpcException(
            generateRpcExceptionResponse(
              HttpStatus.BAD_REQUEST,
              `You have already saved the job with id: '${jobId}'.`,
            ),
          );

        const newSavedJob = savedJobRepository.create({
          user: { id: user.id },
          job: { id: job.id },
        });

        await savedJobRepository.save(newSavedJob);

        savedJobs.push(job);
      }

      return {
        savedJobs,
      };
    });
  };

  public handleRemoveSavedJobs = async (
    removeSavedJobsDto: RemoveSavedJobsDto,
    user: User,
  ) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const jobRepository = queryRunner.manager.getRepository(Job);
      const savedJobRepository = queryRunner.manager.getRepository(SavedJob);

      const { id, role } = user;

      const { jobIds, candidate_id } = removeSavedJobsDto;

      if (role.name === 'admin' && !candidate_id)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.BAD_REQUEST,
            `You must provide the candidate's ID whose saved job list you want to remove.`,
          ),
        );

      if (role.name === 'candidate' && candidate_id)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.BAD_REQUEST,
            `You cannot retrieve the candidate's ID to remove their saved jobs list.`,
          ),
        );

      if (jobIds && jobIds.length) {
        for (const jobId of jobIds.split(',')) {
          const job = await jobRepository.findOne({
            where: { id: jobId },
          });

          if (!job)
            throw new RpcException(
              generateRpcExceptionResponse(
                HttpStatus.NOT_FOUND,
                `Job with id: '${jobId}' not found.`,
              ),
            );

          const findSavedJob = await savedJobRepository.findOne({
            where: {
              user: { id: role.name === 'admin' ? candidate_id : id },
              job: { id: jobId },
            },
          });

          if (!findSavedJob) {
            if (role.name === 'admin')
              throw new RpcException(
                generateRpcExceptionResponse(
                  HttpStatus.BAD_REQUEST,
                  `The user with id '${candidate_id}' has not saved the job with id '${jobId}'.`,
                ),
              );

            throw new RpcException(
              generateRpcExceptionResponse(
                HttpStatus.BAD_REQUEST,
                `The job with id '${jobId}' is not in your saved job list.`,
              ),
            );
          }

          await savedJobRepository.delete(findSavedJob.id);
        }
      }

      return {
        savedJobs: (
          await savedJobRepository.find({
            where: { user: { id: role.name === 'admin' ? candidate_id : id } },
            relations: ['user', 'job'],
          })
        ).map((savedJob) => ({
          ...savedJob,
          user: omit(savedJob.user, ['password']),
        })),
      };
    });
  };

  public handleGetCompanyByRecruiterId = async (recruiterId: string) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const companyRepository = queryRunner.manager.getRepository(Company);

      const companies = await companyRepository.find({
        relations: ['recruiters'],
      });

      const findFirstCompany = companies.find((company) =>
        company.recruiters.some((re) => re.id === recruiterId),
      );

      if (!findFirstCompany)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.NOT_FOUND,
            `Recruiter with id '${recruiterId}' hasn't been assigned with any companies.`,
          ),
        );

      return findFirstCompany;
    });
  };

  public handleUpdateCompanyOfRecruiter = async (
    updateCompanyDto: UpdateCompanyDto,
    recruiterId: string,
  ) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const companyRepository = queryRunner.manager.getRepository(Company);

      const { name } = updateCompanyDto;

      let company = await companyRepository.findOneBy({ name });

      if (!company) {
        company = companyRepository.create(updateCompanyDto);

        await companyRepository.save(company);

        await companyRepository
          .createQueryBuilder()
          .relation(Company, 'recruiters')
          .of(company.id)
          .add(recruiterId);
      } else {
        await companyRepository.update(
          {
            id: company.id,
          },
          updateCompanyDto,
        );
      }
    });
  };

  public handleVerifyJob = async (jobId: string) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const jobRepository = queryRunner.manager.getRepository(Job);

      const job = await jobRepository.findOne({
        where: {
          id: jobId,
        },
        relations: ['recruiter'],
      });

      if (!job)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.NOT_FOUND,
            `Job with id: '${jobId}' not found.`,
          ),
        );

      return job;
    });
  };

  private handleSyncJobsToElasticSearch = async (
    jobRepository: Repository<Job>,
  ) => {
    const jobs = await jobRepository.find({
      relations: ['recruiter', 'recruiter.company', 'requirements'],
    });

    const bulkBody = jobs.flatMap((job) => [
      { index: { _index: ElasticIndexes.JOBS, _id: job.id } },
      {
        id: job.id,
        title: job.title,
        address: job.address,
        description: job.description,
        job_type: job.job_type,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        posted_at: job.posted_at,
        expired_at: job.expired_at,
        recruiter: job.recruiter
          ? {
              id: job.recruiter.id,
              full_name: job.recruiter.full_name,
              email: job.recruiter.email,
              phone_number: job.recruiter.phone_number,
              company: job.recruiter.company?.name || null,
            }
          : null,
        requirements: job.requirements.map((r) => r.requirement),
      },
    ]);

    await this.elasticsearchService.bulk({
      index: ElasticIndexes.JOBS,
      body: bulkBody,
    });
  };

  public handleCalculateStatisticsOfJobs = async (days?: number) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const jobRepository = queryRunner.manager.getRepository(Job);

      const dayFilter = subDays(new Date(), days ?? 7);

      const dynamicKey = `newJobsLast${days ?? 7}Days`;

      const [totalJobs, openedJobs, closedJobs, jobsInDaysAgo] =
        await Promise.all([
          jobRepository.count(),
          jobRepository.count({ where: { status: 'open' } }),
          jobRepository.count({ where: { status: 'closed' } }),
          jobRepository.count({ where: { createdAt: MoreThan(dayFilter) } }),
        ]);

      return { totalJobs, openedJobs, closedJobs, [dynamicKey]: jobsInDaysAgo };
    });
  };

  public handleGetStatisticsJobsOfCompanies = async (
    top?: number,
    isDetailed?: boolean,
  ) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const jobRepository = queryRunner.manager.getRepository(Job);

      if (isDetailed) {
        const topCompaniesQuery = jobRepository
          .createQueryBuilder('job')
          .innerJoin('job.recruiter', 'recruiter')
          .innerJoin('recruiter.company', 'company')
          .select('company.id', 'companyId')
          .addSelect('company.name', 'companyName')
          .addSelect('COUNT(job.id)', 'jobCount')
          .groupBy('company.id')
          .orderBy('jobCount', 'DESC');

        if (top) {
          topCompaniesQuery.limit(top);
        }

        const topCompanies = await topCompaniesQuery.getRawMany();

        if (!topCompanies.length) return [];

        const topCompanyIds = topCompanies.map((c) => c.companyId);

        return jobRepository
          .createQueryBuilder('job')
          .innerJoin('job.recruiter', 'recruiter')
          .innerJoin('recruiter.company', 'company')
          .leftJoin('job.savedByUsers', 'savedByUsers')
          .leftJoin('job.applications', 'applications')
          .select([
            'company.name AS company',
            'job.title AS jobTitle',
            'COALESCE(COUNT(DISTINCT savedByUsers.id), 0) AS savedJobs',
            'COALESCE(COUNT(DISTINCT applications.id), 0) AS applications',
          ])
          .where('company.id IN (:...topCompanyIds)', { topCompanyIds })
          .groupBy('job.id, company.id')
          .orderBy('company.name', 'ASC')
          .addOrderBy('applications', 'DESC')
          .getRawMany()
          .then((jobs) => {
            const result = jobs.reduce((acc, job) => {
              const company = acc.find((c: any) => c.company === job.company);
              if (company) {
                company.jobs.push({
                  jobTitle: job.jobTitle,
                  savedJobs: parseInt(job.savedJobs as string),
                  applications: parseInt(job.applications as string),
                });
              } else {
                acc.push({
                  company: job.company,
                  jobs: [
                    {
                      jobTitle: job.jobTitle,
                      savedJobs: parseInt(job.savedJobs as string),
                      applications: parseInt(job.applications as string),
                    },
                  ],
                });
              }

              return acc;
            }, []);

            return result;
          });
      }

      const query = jobRepository
        .createQueryBuilder('job')
        .innerJoin('job.recruiter', 'recruiter')
        .innerJoin('recruiter.company', 'company')
        .select('company.name', 'company')
        .addSelect('COUNT(job.id)', 'jobCount')
        .groupBy('company.id')
        .orderBy('jobCount', 'DESC');

      if (top) {
        query.limit(top);
      }

      return query.getRawMany();
    });
  };

  public handleGetStatisticsSalariesOfPositions = async () => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const jobRepository = queryRunner.manager.getRepository(Job);

      const result = await jobRepository
        .createQueryBuilder('job')
        .select('job.category', 'position')
        .addSelect(
          'ROUND(AVG((job.salary_min + job.salary_max) / 2), 2)',
          'average_salary',
        )
        .groupBy('job.category')
        .orderBy('average_salary', 'DESC')
        .getRawMany();

      return result.map((item) => ({
        position: item.position,
        average_salary: `${parseFloat(item.average_salary as string).toFixed(2)} ($)`,
      }));
    });
  };

  public handleGetStatisticsOfJobTypes = async () => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const jobRepository = queryRunner.manager.getRepository(Job);

      const result = await jobRepository
        .createQueryBuilder('job')
        .select('job.job_type', 'contract_type')
        .addSelect(
          `ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM job)), 2)`,
          'percentage',
        )
        .groupBy('job.job_type')
        .orderBy('percentage', 'DESC')
        .getRawMany();

      return result.map((item) => ({
        contract_type: this.formatContractType(item.contract_type as string),
        percentage: `${item.percentage}%`,
      }));
    });
  };

  public handleGenerateJobReportData = async () => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const jobRepository = queryRunner.manager.getRepository(Job);

      return jobRepository
        .createQueryBuilder('job')
        .innerJoin('job.recruiter', 'recruiter')
        .innerJoin('recruiter.company', 'company')
        .leftJoin('job.savedByUsers', 'savedByUsers')
        .leftJoin('job.applications', 'applications')
        .leftJoin(
          'transaction',
          'transaction',
          'transaction.user_id = job.recruiter_id AND transaction.status = :status',
          { status: 'SUCCESS' },
        )
        .select([
          'company.name AS company',
          'COUNT(DISTINCT job.id) AS totalJobs',
          'COUNT(DISTINCT applications.id) AS totalApplications',
          'COUNT(DISTINCT savedByUsers.id) AS totalSavedJobs',
          'SUM(CASE WHEN job.status = "closed" THEN 1 ELSE 0 END) AS totalClosedJobs',
          'COALESCE(SUM(transaction.amount), 0) AS revenue',
        ])
        .groupBy('company.id')
        .getRawMany();
    });
  };

  private formatContractType(jobType: string): string {
    const contractTypes: Record<string, string> = {
      full_time: 'Full-time',
      part_time: 'Part-time',
      remote: 'Remote',
      freelance: 'Freelance',
    };

    return contractTypes[jobType] || 'Other';
  }

  public handleSearchJobsByTitle = async (title: string) => {
    try {
      const { hits } = await this.elasticsearchService.search<Job>({
        index: ElasticIndexes.JOBS,
        body: {
          query: {
            multi_match: {
              query: title,
              fields: ['title^3', 'description'],
              fuzziness: 'AUTO',
              operator: 'OR',
            },
          },
        },
      });

      return hits.hits.map((hit) => hit._source);
    } catch (err) {
      if (err?.meta?.statusCode === 404) return [];
      console.error('Elasticsearch search error: ', err);
      throw err;
    }
  };
}
