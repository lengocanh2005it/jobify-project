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

  public handleCreateJob = async (
    createJobDto: CreateJobDto,
    recruiterId: string,
  ) => {
    try {
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
        throw new RpcException('This job has been posted by you.');

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
    }
  };

  public handleApproveJobs = async (jobIds: string[]) => {
    try {
      const jobs: Job[] = [];

      for (const jobId of jobIds) {
        const job = await this.jobRepository.findOneBy({ id: jobId });

        if (!job) throw new RpcException(`Job With Id: '${jobId}' Not Found.`);

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
            ],
          })) as Job,
        );
      }

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

      return jobs.map((job) => {
        const { applications, ...res } = job;

        return res;
      });
    } catch (err) {
      console.error(err);
    }
  };

  public handleGetJobs = async (filters?: SearchJobsDto) => {
    try {
      const query = this.jobRepository
        .createQueryBuilder('job')
        .leftJoinAndSelect('job.recruiter', 'recruiter')
        .leftJoinAndSelect('recruiter.company', 'company')
        .select([
          'job',
          'recruiter.id',
          'recruiter.full_name',
          'recruiter.email',
          'recruiter.phone_number',
          'company.name',
        ]);

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
      }));
    } catch (err) {
      console.error(err);
    }
  };

  public handleDeleteJob = async (jobId: string) => {
    try {
      const job = await this.jobRepository.findOneBy({ id: jobId });

      if (!job) throw new RpcException(`Job With ID: '${jobId}' Not Found.`);

      await this.jobRepository.delete({ id: jobId });

      return { msg: 'Job deleted successfully.' };
    } catch (err) {
      console.error(err);
    }
  };

  public handleUpdateJob = async (
    updateJobDto: UpdateJobDto,
    jobId: string,
  ) => {
    try {
      let job = await this.jobRepository.findOneBy({ id: jobId });

      if (!job) throw new RpcException(`Job With ID: '${jobId}' Not Found.`);

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

  public handleGetJob = async (jobId: string) => {
    try {
      const job = await this.jobRepository.findOne({
        where: { id: jobId },
        relations: ['requirements'],
      });

      if (!job) throw new RpcException(`Job With ID: '${jobId}' Not Found.`);

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

  public handleSavedJobs = async (jobIds: string[], userId: string) => {
    try {
      for (const jobId of jobIds) {
        const job = await this.jobRepository.findOneBy({ id: jobId });

        if (!job) throw new RpcException(`Job With ID: '${jobId}' Not Found.`);

        const newSavedJob = this.savedJobRepository.create({
          user: { id: userId },
          job: { id: job.id },
        });

        await this.savedJobRepository.save(newSavedJob);
      }

      return {
        message: 'Saved these jobs successfully!',
      };
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  public handleRemoveSavedJobs = async (jobIds: string[], userId: string) => {
    try {
      for (const jobId of jobIds) {
        const job = await this.jobRepository.findOne({
          where: { id: jobId },
          relations: ['user', 'job'],
        });

        if (!job) throw new RpcException(`Job With ID: '${jobId}' Not Found.`);

        await this.savedJobRepository.delete({
          user: { id: userId },
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
}
