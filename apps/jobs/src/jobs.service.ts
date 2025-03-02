import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Company } from 'apps/jobs/src/entities/companies.entity';
import { Job } from 'apps/jobs/src/entities/jobs.entity';
import { Requirement } from 'apps/jobs/src/entities/requirements.entity';
import { SavedJob } from 'apps/jobs/src/entities/saved-jobs.entity';
import { User } from 'apps/users/src/entities/users.entity';
import { NotificationTypes } from 'libs/common/constants';
import { CreateJobDto } from 'libs/common/dtos';
import { CreateCompanyDto } from 'libs/common/dtos/create-company.dto';
import { SearchJobsDto } from 'libs/common/dtos/search-jobs.dto';
import { UpdateJobDto } from 'libs/common/dtos/update-job.dto';
import { lastValueFrom } from 'rxjs';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job) private readonly jobRepository: Repository<Job>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Requirement)
    private readonly requirementRepository: Repository<Requirement>,
    @Inject('NOTIFICATIONS_SERVICE')
    private readonly rabbitMqNotificationClient: ClientProxy,
    @Inject('USERS_SERVICE') private readonly rabbitMqUserClient: ClientProxy,
    @InjectRepository(SavedJob)
    private readonly savedJobRepository: Repository<SavedJob>,
  ) {}

  public handleCreateCompany = async (
    userId: string,
    createCompanyDto: CreateCompanyDto,
  ): Promise<any> => {
    const { name } = createCompanyDto;

    let company: Company | null;

    company = await this.companyRepository.findOneBy({ name });

    if (!company) {
      company = this.companyRepository.create(createCompanyDto);

      await this.companyRepository.save(company);
    }

    await this.dataSource
      .createQueryBuilder()
      .relation(Company, 'recruiters')
      .of(company.id)
      .add(userId);

    const { recruiters, ...res } = (await this.companyRepository.findOne({
      where: { id: company.id },
      relations: ['recruiters', 'requirements'],
    })) as Company;

    return {
      ...res,
      recruiters: recruiters.map((recruiter) => {
        const { password, ...res } = recruiter;
        return res;
      }),
    };
  };

  public handleCreateJob = async (createJobDto: CreateJobDto, user: User) => {
    try {
      const { role, id } = user;

      let recruiterId = id;

      if (role.name === 'admin') {
        const { recruiter_id } = createJobDto;

        if (!recruiter_id)
          throw new RpcException(
            'Admin must specify a recruiter_id in CreateJobDto.',
          );

        recruiterId = recruiter_id;
      }

      const { posted_at, expired_at, title, description } = createJobDto;

      const { requirements, ...resCreateJobDto } = createJobDto;

      const now = new Date();

      const postedDate = new Date(posted_at);

      const expiredDate = new Date(expired_at);

      if (now.getTime() > postedDate.getTime())
        throw new RpcException(
          'Posted date must be greater than or equal to current date.',
        );

      if (postedDate.getTime() > expiredDate.getTime())
        throw new RpcException(
          'Expired date must be greater than posted date.',
        );

      const existingJob = await this.jobRepository.findOne({
        where: { title, description, recruiter: { id: recruiterId } },
        relations: ['recruiter'],
      });

      if (existingJob)
        throw new RpcException(
          `This job has been posted by ${role.name === 'admin' ? `recruiter with id '${recruiterId}'` : 'you'}`,
        );

      const newJob = this.jobRepository.create(resCreateJobDto);

      await this.jobRepository.save(newJob);

      if (requirements && requirements.length) {
        for (const requirement of requirements) {
          let newRequirement = await this.requirementRepository.findOneBy({
            requirement,
          });

          if (!newRequirement) {
            newRequirement = this.requirementRepository.create({ requirement });

            await this.requirementRepository.save(newRequirement);
          }

          await this.dataSource
            .createQueryBuilder()
            .relation(Job, 'requirements')
            .of(newJob.id)
            .add(newRequirement.id);
        }
      }

      await this.dataSource
        .createQueryBuilder()
        .relation(Job, 'recruiter')
        .of(newJob.id)
        .set(recruiterId);

      const savedJob = (await this.jobRepository.findOne({
        where: { id: newJob.id },
        relations: ['recruiter', 'requirements'],
      })) as Job;

      const { password, createdAt, updatedAt, ...res } = savedJob.recruiter;

      return {
        ...savedJob,
        recruiter: res,
      };
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  public handleApproveJobs = async (jobIds: string[]) => {
    try {
      const jobs: Job[] = [];

      for (const jobId of jobIds) {
        const job = await this.jobRepository.findOneBy({ id: jobId });

        if (!job) throw new RpcException(`Job with id: '${jobId}' not found.`);

        await this.jobRepository.update(
          {
            id: jobId,
          },
          {
            is_approved: true,
          },
        );

        jobs.push(
          (await this.jobRepository.findOne({
            where: { id: jobId },
            relations: [
              'applications',
              'applications.candidate',
              'requirements',
              'recruiter',
            ],
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
        userIds: jobs.map((j) => j.recruiter.id),
      });

      const { title, description, key } = NotificationTypes.RECOMMENDED_JOB;

      for (const job of jobs) {
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
            },
            userIds: matchedUsers.map((user) => user.id),
          });
        }
      }

      return jobs.map(({ applications, recruiter, ...res }) => ({
        ...res,
        requirements: res.requirements.map((r) => r.requirement),
      }));
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  public handleGetJobs = async (user: User, filters?: SearchJobsDto) => {
    try {
      const { role, id } = user;

      const query = this.jobRepository
        .createQueryBuilder('job')
        .leftJoinAndSelect('job.recruiter', 'recruiter')
        .leftJoinAndSelect('job.requirements', 'requirements')
        .leftJoinAndSelect('recruiter.company', 'company')
        .select([
          'job',
          'recruiter.id',
          'recruiter.full_name',
          'recruiter.email',
          'recruiter.phone_number',
          'company.name',
          'requirements',
        ]);

      if (role.name === 'recruiter') {
        query.andWhere('recruiter.id = :id', {
          id,
        });
      }

      if (filters) {
        if (filters.title) {
          query.andWhere('LOWER(job.title) LIKE LOWER(:title)', {
            title: `%${filters.title}%`,
          });
        }

        if (filters.address) {
          query.andWhere('LOWER(job.address) LIKE LOWER(:address)', {
            address: `%${filters.address}%`,
          });
        }

        if (filters.job_type) {
          query.andWhere('LOWER(job.job_type) = LOWER(:job_type)', {
            job_type: filters.job_type,
          });
        }

        if (filters.salary_min) {
          query.andWhere('job.salary_min >= :salary_min', {
            salary_min: filters.salary_min,
          });
        }

        if (filters.salary_max) {
          query.andWhere('job.salary_max <= :salary_max', {
            salary_max: filters.salary_max,
          });
        }
      }

      const jobs = await query.getMany();

      return jobs.map(({ recruiter, ...job }) => ({
        ...job,
        recruiter: recruiter
          ? {
              id: recruiter.id,
              full_name: recruiter.full_name,
              email: recruiter.email,
              phone_number: recruiter.phone_number,
              company: recruiter?.company?.name ? recruiter.company.name : null,
            }
          : null,
        requirements: job.requirements.map((re) => re.requirement),
      }));
    } catch (err) {
      console.error(err);
    }
  };

  public handleDeleteJob = async (jobId: string, user: User) => {
    try {
      const job = await this.jobRepository.findOne({
        where: {
          id: jobId,
        },
        relations: ['recruiter'],
      });

      if (!job) throw new RpcException(`Job With ID: '${jobId}' Not Found.`);

      const { id, role } = user;

      if (job.recruiter.id !== id && role.name === 'recruiter')
        throw new RpcException(`You can only delete job that you posted.`);

      const jobWithRequirements = await this.jobRepository.findOne({
        where: {
          id: jobId,
        },
        relations: ['requirements'],
      });

      console.log('Job with requirements: ', jobWithRequirements?.requirements);

      await this.jobRepository.delete({ id: jobId });

      return { success: 'Job deleted successfully.' };
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  public handleUpdateJob = async (
    updateJobDto: UpdateJobDto,
    jobId: string,
    user: User,
  ) => {
    try {
      let job = await this.jobRepository.findOne({
        where: {
          id: jobId,
        },
        relations: ['recruiter'],
      });

      if (!job) throw new RpcException(`Job With ID: '${jobId}' Not Found.`);

      const { role, id } = user;

      if (job.recruiter.id !== id && role.name === 'recruiter')
        throw new RpcException(
          'You can only update the job that you have posted.',
        );

      const { requirements, ...res } = updateJobDto;

      await this.jobRepository.update(
        { id: jobId },
        {
          ...res,
          is_approved: false,
        },
      );

      job = (await this.jobRepository.findOne({
        where: { id: jobId },
        relations: ['requirements', 'recruiter'],
      })) as Job;

      const { recruiter, ...data } = job;

      const { password, ...resData } = recruiter;

      return {
        ...data,
        recruiter: resData,
      };
    } catch (error) {
      console.error(error);
    }
  };

  public handleGetJob = async (jobId: string, user: User) => {
    try {
      const job = await this.jobRepository.findOne({
        where: { id: jobId },
        relations: ['requirements', 'recruiter'],
      });

      if (!job) throw new RpcException(`Job With ID: '${jobId}' Not Found.`);

      const { id, role } = user;

      if (job.recruiter.id !== id && role.name === 'recruiter')
        throw new RpcException(`You can only get a job that you have posted.`);

      if (
        !job.applications.some((app) => app.candidate.id === id) &&
        role.name === 'candidate'
      )
        throw new RpcException(
          'You can only get a job that you have applied for.',
        );

      return job;
    } catch (err) {
      console.error(err);
    }
  };

  public handleGetCompany = async (companyId: string) => {
    try {
      const company = await this.companyRepository.findOne({
        where: { id: companyId },
        relations: ['recruiters'],
      });

      if (!company)
        throw new RpcException(`Company With ID: '${companyId}' Not Found.`);

      return {
        ...company,
        recruiters: company.recruiters.map((re) => {
          const { password, ...res } = re;

          return {
            ...res,
          };
        }),
      };
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  public handleSavedJobs = async (jobIds: string[], user: User) => {
    try {
      const savedJobs: Job[] = [];

      for (const jobId of jobIds) {
        const job = await this.jobRepository.findOneBy({ id: jobId });

        if (!job) throw new RpcException(`Job With ID: '${jobId}' Not Found.`);

        if (
          await this.savedJobRepository.findOne({
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
            `You have already saved the job with id: '${jobId}'`,
          );

        const newSavedJob = this.savedJobRepository.create({
          user: { id: user.id },
          job: { id: job.id },
        });

        await this.savedJobRepository.save(newSavedJob);

        savedJobs.push(job);
      }

      return {
        success: 'Saved these jobs successfully!',
        savedJobs,
      };
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  public handleRemoveSavedJobs = async (jobIds: string[], user: User) => {
    try {
      const { id } = user;

      for (const jobId of jobIds) {
        const job = await this.jobRepository.findOne({
          where: { id: jobId },
          relations: ['user', 'job'],
        });

        if (!job) throw new RpcException(`Job With ID: '${jobId}' Not Found.`);

        if (
          !(
            await this.savedJobRepository.find({
              relations: ['user'],
            })
          ).some((job) => job.user.id === id)
        )
          throw new RpcException(
            `You can only remove the saved job that you saved before.`,
          );

        await this.savedJobRepository.delete({
          user: { id },
          job: { id: jobId },
        });
      }

      return {
        message: 'Remove these jobs successfully!',
      };
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  public handleGetAllApplicationsOfJobs = async (recruiterId: string) => {
    try {
      const recruiter = await lastValueFrom<User | null>(
        this.rabbitMqUserClient.send({ cmd: 'get-user' }, recruiterId),
      );

      if (!recruiter)
        throw new RpcException(
          `Recruiter with ID: '${recruiterId}' Not Found.`,
        );

      const jobs = await this.jobRepository.find({
        where: { recruiter: { id: recruiterId } },
        relations: [
          'recruiter',
          'applications',
          'applications.candidate',
          'applications.candidate.skills',
        ],
      });

      return jobs.map(({ applications, recruiter, ...res }) => ({
        ...res,
        applications: applications.map(({ candidate, ...res }) => ({
          ...res,
          candidate: {
            id: candidate.id,
            full_name: candidate.full_name,
            email: candidate.email,
            bio: candidate.bio,
            phone_number: candidate.phone_number,
            skills: candidate.skills.map((skill) => skill.name),
            certifications: candidate.certifications,
          },
        })),
      }));
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  public handleGetCompanyByRecruiterId = async (recruiterId: string) => {
    try {
      const companies = await this.companyRepository.find({
        relations: ['recruiters'],
      });

      const findFirstCompany = companies.find((company) =>
        company.recruiters.some((re) => re.id === recruiterId),
      );

      if (!findFirstCompany)
        throw new RpcException(
          `Recruiter with id '${recruiterId}' hasn't been assigned with any companies.`,
        );

      return findFirstCompany;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  private checkPermissionAccess = (user: User, job: Job) => {};
}
