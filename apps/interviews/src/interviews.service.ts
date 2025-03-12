import {
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Interview } from 'apps/interviews/src/entities';
import { Company, Job } from 'apps/jobs/src/entities';
import { User } from 'apps/users/src/entities';
import {
  ApprovalStatus,
  InterviewStatus,
  InterviewType,
  NotificationTypes,
  Role,
} from 'libs/common/constants';
import {
  CandidatesProcessInterviewsDto,
  CreateInterviewDto,
  ProcessInterviewsDto,
  SearchInterviewsDto,
  UpdateInterviewDto,
} from 'libs/common/dtos';
import { generateRpcExceptionResponse } from 'libs/common/utils';
import { omit } from 'lodash';
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
    user: User,
  ) => {
    const { id, role } = user;

    if (role.name === 'admin' && !createInterviewDto?.recruiter_id) {
      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.BAD_REQUEST,
          `You must be provide recruiter id for creating an interview.`,
        ),
      );
    } else if (role.name === 'recruiter' && createInterviewDto?.recruiter_id)
      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.BAD_REQUEST,
          `You don't have to provide recruiter id for creating an interview.`,
        ),
      );

    const company = await lastValueFrom<Company | null>(
      this.rabbitMqJobClient.send(
        { cmd: 'get-company-by-recruiter-id' },
        role.name === 'admin' ? createInterviewDto.recruiter_id : id,
      ),
    );

    if (!company)
      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.NOT_FOUND,
          `Recruiter with id: '${role.name === 'admin' ? createInterviewDto.recruiter_id : user.id}' 
        doesn't have belong to any companies.`,
        ),
      );

    const { interview_date, candidate_id, job_id, interview_address, ...res } =
      createInterviewDto;

    const candidate = await lastValueFrom<User | null>(
      this.rabbitMqUserClient.send({ cmd: 'get-user-jwt' }, candidate_id),
    );

    if (!candidate)
      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.NOT_FOUND,
          `Candidate with id: '${candidate_id}' not found.`,
        ),
      );

    const job = await lastValueFrom<Job | null>(
      this.rabbitMqJobClient.send({ cmd: 'verify-job' }, job_id),
    );

    if (!job)
      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.NOT_FOUND,
          `Job with id: '${job_id}' not found.`,
        ),
      );

    const now = new Date();

    if (new Date(interview_date).getTime() < now.getTime())
      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.BAD_REQUEST,
          'Interview date must be greater than current date.',
        ),
      );

    let existingInterview = await this.interviewRepository.findOne({
      where: {
        candidate: { id: candidate_id },
        recruiter: {
          id: role.name === 'admin' ? createInterviewDto.candidate_id : id,
        },
      },
      relations: ['candidate', 'recruiter'],
    });

    if (existingInterview)
      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.BAD_REQUEST,
          `You have already created an interview for id of candidate: '${candidate_id}'.`,
        ),
      );

    if (res.interview_type === InterviewType.ONLINE && !res.interview_link)
      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.BAD_REQUEST,
          'Online interview must be has an interview link such as Google Meet link, Zoom Link, etc.',
        ),
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
      .set(role.name === 'admin' ? createInterviewDto.recruiter_id : id);

    await this.dataSource
      .createQueryBuilder()
      .relation(Interview, 'job')
      .of(existingInterview.id)
      .set(job_id);

    const interview = await this.interviewRepository.findOne({
      where: { id: existingInterview.id },
      relations: ['candidate', 'job', 'recruiter'],
    });

    return role.name === 'admin'
      ? omit(interview, ['recruiter.password', 'candidate.password'])
      : omit(interview, ['recruiter', 'candidate.password']);
  };

  public handleProcessInterviews = async (
    processInterviewsDto: ProcessInterviewsDto,
  ) => {
    const { approvedInterviewIds, rejectedInterviewIds } = processInterviewsDto;

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
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.NOT_FOUND,
            `Interview with id '${interviewId}' not found.`,
          ),
        );

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
    user: User,
  ) => {
    const { id, role } = user;

    const interview = await this.interviewRepository.findOne({
      where: { id: interviewId },
      relations: ['candidate', 'recruiter', 'job'],
    });

    if (!interview)
      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.NOT_FOUND,
          `Interview with id '${interviewId}' not found.`,
        ),
      );

    if (role.name === 'admin' && interview.recruiter.id !== id)
      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.BAD_REQUEST,
          `You can only update the review that belongs to you.`,
        ),
      );

    const {
      interview_type,
      interview_link,
      status,
      cancel_reason,
      result,
      interview_address,
      score,
    } = updateInterviewDto;

    if (interview_type === InterviewType.ONLINE && !interview_link)
      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.BAD_REQUEST,
          'Online interview must be has interview link such a Google link, Zoom link, etc.',
        ),
      );

    if (status === InterviewStatus.CANCEL && !cancel_reason)
      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.BAD_REQUEST,
          `Please provide the reason of interview cancellation.`,
        ),
      );

    if (interview_address && interview_type === InterviewType.ONLINE)
      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.BAD_REQUEST,
          `Online interview can't be has an address interview. The address 
          interview only have in offline interview.`,
        ),
      );

    if ((result && !score) || (score && !result))
      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.BAD_REQUEST,
          'You must be provide the result and score concurrently.',
        ),
      );

    await this.interviewRepository.update(
      { id: interviewId },
      {
        ...updateInterviewDto,
        approval_status: ApprovalStatus.PENDING,
      },
    );

    if (result && score) {
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

    const newInterview = await this.interviewRepository.findOne({
      where: {
        id: interviewId,
      },
      relations: ['recruiter', 'candidate', 'job'],
    });

    return role.name === 'admin'
      ? omit(newInterview, ['recruiter.password', 'candidate.password'])
      : omit(newInterview, ['candidate.password', 'recruiter']);
  };

  public handleDeleteInterview = async (interviewId: string, user: User) => {
    const { id, role } = user;

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

    if (role.name === 'recruiter' && interview.recruiter.id !== id)
      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.FORBIDDEN,
          `You can only delete the interview that belongs to you.`,
        ),
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
  };

  public handleGetReviews = async (
    user: User,
    filters?: SearchInterviewsDto,
  ) => {
    const { role, id } = user;

    const query = this.interviewRepository
      .createQueryBuilder('interview')
      .leftJoinAndSelect('interview.recruiter', 'recruiter')
      .leftJoinAndSelect('interview.candidate', 'candidate')
      .leftJoinAndSelect('recruiter.company', 'company')
      .leftJoinAndSelect('interview.job', 'job')
      .select([
        'interview',
        'recruiter.id',
        'recruiter.full_name',
        'recruiter.email',
        'recruiter.phone_number',
        'company.name',
        'candidate.id',
        'candidate.full_name',
        'candidate.email',
        'candidate.phone_number',
        'job.id',
        'job.title',
        'job.description',
      ]);

    if (role.name === 'recruiter') {
      query.andWhere('recruiter.id = :id', { id });
    } else if (role.name === 'candidate') {
      query.andWhere('candidate.id = :id', { id });
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

    return (await query.getMany()).map((interview) => {
      return user.role.name === 'recruiter'
        ? omit(interview, ['recruiter'])
        : interview;
    });
  };

  public handleGetInterview = async (interviewId: string, user: User) => {
    const { id, role } = user;

    const interview = await this.interviewRepository.findOne({
      where: { id: interviewId },
      relations: ['recruiter', 'job', 'candidate'],
    });

    if (!interview)
      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.NOT_FOUND,
          `Interview with id: '${interviewId} not found.'`,
        ),
      );

    if (role.name === 'recruiter' && interview.recruiter.id !== id)
      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.FORBIDDEN,
          `You can only get the interview that you created.`,
        ),
      );

    if (role.name === 'candidate' && interview.candidate.id !== id)
      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.FORBIDDEN,
          `You can only get the interview that recruiter invited you.`,
        ),
      );

    return role.name === 'admin' || role.name === 'candidate'
      ? omit(interview, ['recruiter.password', 'candidate.password'])
      : omit(interview, ['recruiter', 'candidate.password']);
  };

  public handleProcessInterviewsOfCandidates = async (
    user: User,
    processInterviewsOfCandidate: CandidatesProcessInterviewsDto,
  ) => {
    const { id, role } = user;

    const approvedInterviewIds =
      processInterviewsOfCandidate?.approvedInterviewIds ?? [];

    const rejectedInterviews =
      processInterviewsOfCandidate.rejectedInterviews ?? [];

    if (!approvedInterviewIds.length && !rejectedInterviews.length)
      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.BAD_REQUEST,
          'You must be approve or reject the interviews.',
        ),
      );

    if (approvedInterviewIds && approvedInterviewIds.length) {
      for (const approvedInterviewId of approvedInterviewIds) {
        const interview = await this.interviewRepository.findOne({
          where: {
            id: approvedInterviewId,
          },
          relations: ['candidate', 'recruiter'],
        });

        if (!interview) {
          console.warn(
            `Interview with id: '${approvedInterviewId}' not found.`,
          );
          continue;
        }

        if (interview.candidate.id !== id && role.name === 'candidate') {
          console.warn(
            'You can only approve the interviews that you received from job of recruiter.',
          );
          continue;
        }

        if (
          interview.status === InterviewStatus.CANCEL ||
          interview.status === InterviewStatus.FINISHED
        ) {
          console.warn(
            `Interview with id: '${approvedInterviewId}' has been ${
              interview.status === InterviewStatus.CANCEL
                ? 'cancelled'
                : 'finished'
            }.`,
          );
          continue;
        }

        if (
          interview.approval_status === ApprovalStatus.APPROVED ||
          interview.approval_status === ApprovalStatus.REJECTED
        ) {
          console.warn(
            `Interview with id: '${approvedInterviewId}' has been ${
              interview.approval_status === ApprovalStatus.APPROVED
                ? 'approved'
                : 'rejected'
            }.`,
          );
          continue;
        }

        await this.interviewRepository.update(
          { id: approvedInterviewId },
          {
            approval_status: ApprovalStatus.APPROVED,
          },
        );

        const { title, description, key } =
          NotificationTypes.INTERVIEW_RESPONSE_RECEIVED;

        this.rabbitMqNotificationClient.emit('create-notification', {
          data: {
            title,
            message: description,
            type: key,
            metadata: {
              interviewId: approvedInterviewId,
            },
          },
          userIds: [interview.recruiter.id],
        });
      }
    }

    if (rejectedInterviews && rejectedInterviews.length) {
      for (const rejectedInterview of rejectedInterviews) {
        const interview = await this.interviewRepository.findOne({
          where: {
            id: rejectedInterview.interviewId,
          },
          relations: ['candidate', 'recruiter'],
        });

        if (!interview) {
          console.warn(
            `Interview with id: '${rejectedInterview.interviewId}' not found.`,
          );
          continue;
        }

        if (interview.candidate.id !== id && role.name === 'candidate') {
          console.warn(
            'You can only reject the interviews that you received from job of recruiter.',
          );
          continue;
        }

        if (
          interview.status === InterviewStatus.CANCEL ||
          interview.status === InterviewStatus.FINISHED
        ) {
          console.warn(
            `Interview with id: '${rejectedInterview.interviewId}' has been ${
              interview.status === InterviewStatus.CANCEL
                ? 'cancelled'
                : 'finished'
            }.`,
          );
          continue;
        }

        if (
          interview.approval_status === ApprovalStatus.APPROVED ||
          interview.approval_status === ApprovalStatus.REJECTED
        ) {
          console.warn(
            `Interview with id: '${rejectedInterview.interviewId}' has been ${
              interview.approval_status === ApprovalStatus.APPROVED
                ? 'approved'
                : 'rejected'
            }.`,
          );
          continue;
        }

        await this.interviewRepository.update(
          { id: rejectedInterview.interviewId },
          {
            approval_status: ApprovalStatus.REJECTED,
            cancel_reason: rejectedInterview.reason,
            cancelled_by: role.name === 'admin' ? Role.ADMIN : Role.CANDIDATE,
          },
        );

        const { title, description, key } =
          NotificationTypes.INTERVIEW_RESPONSE_RECEIVED;

        this.rabbitMqNotificationClient.emit('create-notification', {
          data: {
            title,
            message: description,
            type: key,
            metadata: {
              interviewId: rejectedInterview.interviewId,
            },
          },
          userIds: [interview.recruiter.id],
        });
      }
    }

    return {
      success: 'Processed the interviews successfully!',
    };
  };
}
