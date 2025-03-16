import {
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { Cron } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { Interview } from 'apps/interviews/src/entities';
import { Company, Job } from 'apps/jobs/src/entities';
import { User } from 'apps/users/src/entities';
import { endOfDay, startOfDay, subDays } from 'date-fns';
import {
  ApprovalStatus,
  ElasticIndexes,
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
import { TransactionsProvider } from 'libs/common/providers';
import { generateRpcExceptionResponse } from 'libs/common/utils';
import { omit, pick } from 'lodash';
import { lastValueFrom } from 'rxjs';
import { Between, DataSource, Repository } from 'typeorm';

@Injectable()
export class InterviewsService implements OnModuleInit {
  private readonly logger = new Logger(InterviewsService.name);

  constructor(
    @Inject('USERS_SERVICE') private readonly rabbitMqUserClient: ClientProxy,
    @Inject('JOBS_SERVICE') private readonly rabbitMqJobClient: ClientProxy,
    @InjectDataSource() private readonly dataSource: DataSource,
    @Inject('NOTIFICATIONS_SERVICE')
    private readonly rabbitMqNotificationClient: ClientProxy,
    private readonly transactionsProvider: TransactionsProvider,
    private readonly elasticsearchService: ElasticsearchService,
  ) {}

  async onModuleInit() {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const interviewRepository = queryRunner.manager.getRepository(Interview);

      return this.handleSyncInterviewsToElasticSearch(interviewRepository);
    });
  }

  @Cron('0 0 * * *')
  async handleNotifyScheduledInterviews() {
    this.logger.log('Starting scheduled interview notification job...');

    await this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const interviewRepository = queryRunner.manager.getRepository(Interview);

      const twoDaysBefore = subDays(new Date(), 2);

      const interviews = await interviewRepository.find({
        relations: ['candidate'],
        where: {
          interview_date: Between(
            startOfDay(twoDaysBefore),
            endOfDay(twoDaysBefore),
          ),
        },
      });

      if (!interviews.length) {
        this.logger.log('No interviews scheduled exactly 2 days ago.');
        return;
      }

      const candidatesIds = interviews.map(
        (interview) => interview.candidate.id,
      );

      this.logger.log(
        `Found ${interviews.length} interviews. Notifying ${candidatesIds.length} candidates...`,
      );

      const { title, description, key } = NotificationTypes.INTERVIEW_REMINDER;

      this.rabbitMqNotificationClient.emit('create-notification', {
        data: {
          title,
          message: description,
          type: key,
        },
        userIds: candidatesIds,
      });

      this.logger.log(
        `Sent notifications to candidates: ${candidatesIds.join(', ')}`,
      );
    });
  }

  public handleCreateInterview = async (
    createInterviewDto: CreateInterviewDto,
    user: User,
  ) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const interviewRepository = queryRunner.manager.getRepository(Interview);

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

      const {
        interview_date,
        candidate_id,
        job_id,
        interview_address,
        ...res
      } = createInterviewDto;

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

      let existingInterview = await interviewRepository.findOne({
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

      existingInterview = interviewRepository.create({
        ...res,
        interview_date: new Date(interview_date),
        interview_address: interview_address
          ? interview_address
          : company.address,
      });

      existingInterview.candidate = candidate;

      existingInterview.job = job;

      await interviewRepository.save(existingInterview);

      await this.dataSource
        .createQueryBuilder()
        .relation(Interview, 'recruiter')
        .of(existingInterview.id)
        .set(role.name === 'admin' ? createInterviewDto.recruiter_id : id);

      const interview = (await interviewRepository.findOne({
        where: { id: existingInterview.id },
        relations: ['candidate', 'job', 'recruiter'],
      })) as Interview;

      await this.elasticsearchService.index({
        index: ElasticIndexes.INTERVIEWS,
        id: interview.id,
        body: {
          ...interview,
          recruiter: pick(interview.recruiter, [
            'id',
            'full_name',
            'email',
            'phone_number',
          ]),
          candidate: pick(interview.candidate, [
            'id',
            'full_name',
            'email',
            'phone_number',
          ]),
          job: pick(interview.job, ['id', 'title', 'description']),
        },
      });

      return role.name === 'admin'
        ? omit(interview, ['recruiter.password', 'candidate.password'])
        : omit(interview, ['recruiter', 'candidate.password']);
    });
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
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const interviewRepository = queryRunner.manager.getRepository(Interview);

      const interviews: Interview[] = [];
      const candidateIds: string[] = [];
      const recruiterIds: string[] = [];

      for (const interviewId of interviewIds) {
        const interview = await interviewRepository.findOne({
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

        await interviewRepository.update(
          { id: interviewId },
          {
            approval_status:
              status === 'approved'
                ? ApprovalStatus.APPROVED
                : ApprovalStatus.REJECTED,
          },
        );

        interviews.push(
          (await interviewRepository.findOne({
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

      return interviews.map((interview) =>
        omit(interview, ['candidate', 'recruiter']),
      );
    });
  };

  public handleUpdateInterview = async (
    updateInterviewDto: UpdateInterviewDto,
    interviewId: string,
    user: User,
  ) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const interviewRepository = queryRunner.manager.getRepository(Interview);

      const { id, role } = user;

      const interview = await interviewRepository.findOne({
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

      await interviewRepository.update(
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

      const newInterview = (await interviewRepository.findOne({
        where: {
          id: interviewId,
        },
        relations: ['recruiter', 'candidate', 'job', 'recruiter.company'],
      })) as Interview;

      await this.elasticsearchService.index({
        index: ElasticIndexes.INTERVIEWS,
        id: newInterview.id,
        body: {
          ...newInterview,
          recruiter: {
            ...pick(newInterview.recruiter, [
              'id',
              'full_name',
              'email',
              'phone_number',
            ]),
            company: {
              name: newInterview.recruiter.company.name,
            },
          },
          candidate: pick(newInterview.candidate, [
            'id',
            'full_name',
            'email',
            'phone_number',
          ]),
          job: pick(newInterview.job, ['id', 'title', 'description']),
        },
      });

      return role.name === 'admin'
        ? omit(newInterview, ['recruiter.password', 'candidate.password'])
        : omit(newInterview, ['candidate.password', 'recruiter']);
    });
  };

  public handleDeleteInterview = async (interviewId: string, user: User) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const interviewRepository = queryRunner.manager.getRepository(Interview);

      const { id, role } = user;

      const interview = await interviewRepository.findOne({
        where: {
          id: interviewId,
        },
        relations: ['recruiter', 'candidate'],
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

      if (role.name === 'admin') {
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
      }

      const { title, description, key } = NotificationTypes.INTERVIEW_CANCELLED;

      await this.elasticsearchService.delete({
        index: ElasticIndexes.INTERVIEWS,
        id: interviewId,
      });

      this.rabbitMqNotificationClient.emit('create-notification', {
        data: {
          title,
          description,
          type: key,
        },
        userIds: [interview.candidate.id],
      });

      await interviewRepository.delete({ id: interviewId });

      return this.handleGetInterviews(user);
    });
  };

  public handleGetInterviews = async (
    user: User,
    filters?: SearchInterviewsDto,
  ) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const { role, id } = user;

      const must: any[] = [];

      if (filters) {
        if (filters?.title) {
          must.push({
            match: { title: filters.title },
          });
        }

        if (filters.interviewDateAfter || filters.interviewDateBefore) {
          const rangeFilter: any = { interview_date: {} };

          if (filters.interviewDateAfter) {
            rangeFilter.interview_date.gte = filters.interviewDateAfter;
          }

          if (filters.interviewDateBefore) {
            rangeFilter.interview_date.lte = filters.interviewDateBefore;
          }

          must.push({ range: rangeFilter });
        }

        if (filters.status) {
          must.push({
            match: {
              status: filters.status,
            },
          });
        }

        if (filters.approval_status) {
          must.push({
            match: {
              approval_status: filters.approval_status,
            },
          });
        }

        if (filters.interview_type) {
          must.push({
            match: {
              interview_type: filters.interview_type,
            },
          });
        }

        if (filters.result) {
          must.push({
            result: filters.result,
          });
        }

        if (filters.score) {
          must.push({
            score: filters.score,
          });
        }
      }

      switch (role.name) {
        case 'recruiter':
          must.push({ match: { 'recruiter.id': id } });
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
        index: ElasticIndexes.INTERVIEWS,
        body: queryBody,
      });

      return hits.hits.map((hit) => hit._source);
    });
  };

  public handleGetInterview = async (interviewId: string, user: User) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const { id, role } = user;

      const { _source } = await this.elasticsearchService.get<Interview>({
        index: ElasticIndexes.INTERVIEWS,
        id: interviewId,
      });

      if (!_source)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.NOT_FOUND,
            `Interview with id: '${interviewId}' not found.`,
          ),
        );

      if (role.name === 'recruiter' && _source.recruiter.id !== id)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.FORBIDDEN,
            `You can only get the interview that you created.`,
          ),
        );

      if (role.name === 'candidate' && _source.candidate.id !== id)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.FORBIDDEN,
            `You can only get the interview that recruiter invited you.`,
          ),
        );

      return role.name === 'admin' || role.name === 'candidate'
        ? omit(_source, ['recruiter.password', 'candidate.password'])
        : omit(_source, ['recruiter', 'candidate.password']);
    });
  };

  public handleProcessInterviewsOfCandidates = async (
    user: User,
    processInterviewsOfCandidate: CandidatesProcessInterviewsDto,
  ) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const interviewRepository = queryRunner.manager.getRepository(Interview);

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
          const interview = await interviewRepository.findOne({
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

          await interviewRepository.update(
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
          const interview = await interviewRepository.findOne({
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

          await interviewRepository.update(
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
    });
  };

  private handleSyncInterviewsToElasticSearch = async (
    interviewRepository: Repository<Interview>,
  ) => {
    const interviews = await interviewRepository.find({
      relations: ['recruiter', 'candidate', 'job', 'recruiter.company'],
    });

    const bulkBody = interviews.flatMap((interview) => [
      { index: { _index: ElasticIndexes.INTERVIEWS, _id: interview.id } },
      {
        ...interview,
        recruiter: {
          ...pick(interview.recruiter, [
            'id',
            'full_name',
            'email',
            'phone_number',
          ]),
          company: {
            name: interview.recruiter.company.name,
          },
        },
        candidate: pick(interview.candidate, [
          'id',
          'full_name',
          'email',
          'phone_number',
        ]),
        job: pick(interview.job, ['id', 'title', 'description']),
      },
    ]);

    await this.elasticsearchService.bulk({
      index: ElasticIndexes.INTERVIEWS,
      body: bulkBody,
    });
  };
}
