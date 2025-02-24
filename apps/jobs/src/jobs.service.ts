import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Company } from 'apps/jobs/src/entities/companies.entity';
import { Job } from 'apps/jobs/src/entities/jobs.entity';
import { Requirement } from 'apps/jobs/src/entities/requirements.entity';
import { CreateJobDto } from 'libs/common/dtos';
import { CreateCompanyDto } from 'libs/common/dtos/create-company.dto';
import { UpdateJobDto } from 'libs/common/dtos/update-job.dto';
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

        jobs.push((await this.jobRepository.findOneBy({ id: jobId })) as Job);
      }

      return jobs;
    } catch (err) {
      console.error(err);
    }
  };

  public handleGetJobs = async () => {
    try {
      return await this.jobRepository.find({
        relations: ['requirements'],
      });
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
      const company = await this.companyRepository.findOneBy({ id: companyId });

      if (!company)
        throw new RpcException(`Company With ID: '${companyId}' Not Found.`);

      return company;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };
}
