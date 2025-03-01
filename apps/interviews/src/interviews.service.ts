import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Interview } from 'apps/interviews/src/entities/interviews.entity';
import { Company } from 'apps/jobs/src/entities/companies.entity';
import { Job } from 'apps/jobs/src/entities/jobs.entity';
import { User } from 'apps/users/src/entities/users.entity';
import {
  ApprovalStatus,
  InterviewStatus,
  InterviewType,
  NotificationTypes,
} from 'libs/common/constants';
import { CreateInterviewDto } from 'libs/common/dtos/create-interview.dto';
import { ProcessInterviewsDto } from 'libs/common/dtos/process-interviews.dto';
import { SearchInterviewsDto } from 'libs/common/dtos/search-interviews.dto';
import { UpdateInterviewDto } from 'libs/common/dtos/update-interview.dto';
import { lastValueFrom } from 'rxjs';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class InterviewsService {
  constructor(
    @InjectRepository(Interview)
    private readonly interviewRepository: Repository<Interview>,
    @Inject('USERS_SERVICE') private readonly rabbitMqUserClient: ClientProxy,
    @Inject('JOBS_SERVICE') private readonly rabbitMqJobClient: ClientProxy,
    @InjectDataSource() private readonly dataSource: DataSource,
    @Inject('NOTIFICATIONS_SERVICE')
    private readonly rabbitMqNotificationClient: ClientProxy,
  ) {}

  public handleCreateInterview = async (
    createInterviewDto: CreateInterviewDto,
    recruiterId: string,
  ) => {
    try {
      const company = await lastValueFrom<Company | null>(
        this.rabbitMqJobClient.send(
          { cmd: 'get-company-by-recruiter-id' },
          recruiterId,
        ),
      );

      if (!company)
        throw new RpcException(
          `Recruiter with id: '${recruiterId}' doesn't have belong to any companies.`,
        );

      const {
        interview_date,
        candidate_id,
        job_id,
        interview_address,
        ...res
      } = createInterviewDto;

      const candidate = await lastValueFrom<User | null>(
        this.rabbitMqUserClient.send({ cmd: 'get-user' }, candidate_id),
      );

      if (!candidate)
        throw new RpcException(
          `Candidate with id: '${candidate_id}' not found.`,
        );

      const job = await lastValueFrom<Job | null>(
        this.rabbitMqJobClient.send({ cmd: 'get-job' }, job_id),
      );

      if (!job) throw new RpcException(`Job with id: '${job_id}' not found.`);

      const now = new Date();

      if (new Date(interview_date).getTime() < now.getTime())
        throw new RpcException(
          'Interview date must be greater than current date.',
        );

      let existingInterview = await this.interviewRepository.findOne({
        where: {
          candidate: { id: candidate_id },
          recruiter: { id: recruiterId },
        },
        relations: ['candidate', 'recruiter'],
      });

      if (existingInterview)
        throw new RpcException(
          `You have already created an interview for id of candidate: '${candidate_id}'.`,
        );

      if (res.interview_type === InterviewType.ONLINE && !res.interview_link)
        throw new RpcException(
          'Online interview must be has an interview link such as Google Meet link, Zoom Link, etc.',
        );

      existingInterview = this.interviewRepository.create({
        ...res,
        interview_date: new Date(interview_date),
        interview_address: interview_address
          ? interview_address
          : company.address,
      });

      await this.interviewRepository.save(existingInterview);

      await this.dataSource
        .createQueryBuilder()
        .relation(Interview, 'candidate')
        .of(existingInterview.id)
        .set(candidate_id);

      await this.dataSource
        .createQueryBuilder()
        .relation(Interview, 'recruiter')
        .of(existingInterview.id)
        .set(recruiterId);

      await this.dataSource
        .createQueryBuilder()
        .relation(Interview, 'job')
        .of(existingInterview.id)
        .set(job_id);

      return await this.interviewRepository.findOne({
        where: { id: existingInterview.id },
      });
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  public handleProcessInterviews = async (
    processInterviewsDto: ProcessInterviewsDto,
  ) => {
    try {
      const { approvedInterviewIds, rejectedInterviewIds } =
        processInterviewsDto;

      const processInterviews: Record<string, Partial<Interview>[]> = {};

      if (approvedInterviewIds && approvedInterviewIds.length) {
        processInterviews.approvedInterviews =
          await this.handleGenerateProcessInterviews(
            approvedInterviewIds,
            'approved',
          );
      }

      if (rejectedInterviewIds && rejectedInterviewIds.length) {
        processInterviews.rejectedInterviews =
          await this.handleGenerateProcessInterviews(
            rejectedInterviewIds,
            'rejected',
          );
      }

      return processInterviews;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  private handleGenerateProcessInterviews = async (
    interviewIds: string[],
    status: string,
  ) => {
    const interviews: Interview[] = [];
    const candidateIds: string[] = [];
    const recruiterIds: string[] = [];

    for (const interviewId of interviewIds) {
      const interview = await this.interviewRepository.findOne({
        where: {
          id: interviewId,
        },
        relations: ['candidate', 'recruiter'],
      });

      if (!interview)
        throw new RpcException(`Interview with id '${interviewId}' not found.`);

      await this.interviewRepository.update(
        { id: interviewId },
        {
          approval_status:
            status === 'approved'
              ? ApprovalStatus.APPROVED
              : ApprovalStatus.REJECTED,
        },
      );

      interviews.push(
        (await this.interviewRepository.findOne({
          where: { id: interviewId },
        })) as Interview,
      );

      if (status === 'approved') {
        candidateIds.push(interview.candidate.id);
      } else if (status === 'rejected') {
        recruiterIds.push(interview.recruiter.id);
      }
    }

    const { title, description, key } =
      status === 'approved'
        ? NotificationTypes.INTERVIEW_SCHEDULED
        : NotificationTypes.INTERVIEW_CANCELED_BY_ADMIN;

    this.rabbitMqNotificationClient.emit('create-notification', {
      data: {
        title,
        message: description,
        type: key,
      },
      userIds: status === 'approved' ? candidateIds : recruiterIds,
    });

    return interviews.map(({ candidate, recruiter, ...res }) => res);
  };

  public handleUpdateInterview = async (
    updateInterviewDto: UpdateInterviewDto,
    interviewId: string,
  ) => {
    try {
      const interview = await this.interviewRepository.findOne({
        where: { id: interviewId },
        relations: ['candidate'],
      });

      if (!interview)
        throw new RpcException(`Interview with id '${interviewId}' not found.`);

      const {
        interview_type,
        interview_link,
        status,
        cancel_reason,
        result,
        interview_address,
      } = updateInterviewDto;

      if (interview_type === InterviewType.ONLINE && !interview_link)
        throw new RpcException(
          'Online interview must be has interview link such a Google link, Zoom link, etc.',
        );

      if (status === InterviewStatus.CANCEL && !cancel_reason)
        throw new RpcException(
          `Please provide the reason of interview cancellation.`,
        );

      if (interview_address && interview_type === InterviewType.ONLINE)
        throw new RpcException(
          `Online interview can't be has an address interview. The address 
          interview only have in offline interview.`,
        );

      await this.interviewRepository.update(
        { id: interviewId },
        {
          ...updateInterviewDto,
          approval_status: ApprovalStatus.PENDING,
        },
      );

      if (result) {
        const { title, description, key } = NotificationTypes.INTERVIEW_RESULT;

        this.rabbitMqNotificationClient.emit('create-notification', {
          data: {
            title,
            message: description,
            type: key,
          },
          userIds: [interview.candidate.id],
        });
      }

      return await this.interviewRepository.findOne({
        where: {
          id: interviewId,
        },
      });
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  public handleDeleteInterview = async (interviewId: string) => {
    try {
      const interview = await this.interviewRepository.findOne({
        where: {
          id: interviewId,
        },
        relations: ['recruiter'],
      });

      if (!interview)
        throw new NotFoundException(
          `Interview with id: '${interviewId}' not found.`,
        );

      const { title, description, key } =
        NotificationTypes.INTERVIEW_DELETED_BY_ADMIN;

      this.rabbitMqNotificationClient.emit('create-notification', {
        data: {
          title,
          message: description,
          type: key,
        },
        userIds: [interview.recruiter.id],
      });

      await this.interviewRepository.delete({ id: interviewId });

      return {
        success: 'Interview deleted successfully!',
      };
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  public handleGetInterviewsOfRecruiters = async (recruiterId: string) => {
    try {
      const interviews = await this.interviewRepository.find({
        where: {
          recruiter: { id: recruiterId },
        },
        relations: ['recruiter'],
      });

      return interviews.map(
        ({ recruiter: { password, ...resData }, ...res }) => ({
          ...res,
          recruiter: resData,
        }),
      );
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  public handleGetReviews = async (
    user: User,
    filters?: SearchInterviewsDto,
  ) => {
    try {
      const { role, id } = user;

      const query = this.interviewRepository
        .createQueryBuilder('interview')
        .leftJoinAndSelect('interview.recruiter', 'recruiter');

      if (role.name !== 'admin') {
        query.andWhere('recruiter.id = :id', { id });
      }

      if (filters) {
        if (filters.title) {
          query.andWhere('LOWER(interview.title) LIKE LOWER(:title)', {
            title: `%${filters.title}%`,
          });
        }

        if (filters.approval_status) {
          query.andWhere(
            'LOWER(interview.approval_status) = LOWER(:approval_status)',
            {
              approval_status: filters.approval_status,
            },
          );
        }

        if (filters.interview_type) {
          query.andWhere(
            'LOWER(interview.interview_type) = LOWER(:interview_type)',
            {
              interview_type: filters.interview_type,
            },
          );
        }

        if (filters.result) {
          query.andWhere('LOWER(interview.result) = LOWER(:result)', {
            result: filters.result,
          });
        }

        if (filters.score) {
          const scoreValue = Number(filters.score);

          if (!isNaN(scoreValue)) {
            query.andWhere('interview.score = :score', { score: scoreValue });
          }
        }

        if (filters.status) {
          query.andWhere('LOWER(interview.status) = LOWER(:status)', {
            status: filters.status,
          });
        }
      }

      return (await query.getMany()).map(
        ({ recruiter: { password, ...res }, ...resData }) => ({
          ...resData,
          recruiter: {
            id: res.id,
            full_nae: res.full_name,
            email: res.email,
            phone_number: res.phone_number,
            address: res.address,
          },
        }),
      );
    } catch (err) {
      console.error(err);
      throw err;
    }
  };
}
