import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Application } from 'apps/applications/src/entities/applications.entity';
import { Job } from 'apps/jobs/src/entities/jobs.entity';
import { CreateApplicationDto } from 'libs/common/dtos/create-application.dto';
import { UpdateApplicationDto } from 'libs/common/dtos/update-application.dto';
import { lastValueFrom } from 'rxjs';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    @Inject('JOBS_SERVICE') private readonly rabbitMqJobClient: ClientProxy,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  public handleCreateApplication = async (
    createApplicationDto: CreateApplicationDto,
    userId: string,
  ) => {
    try {
      const { job_id: jobId } = createApplicationDto;

      const job = await lastValueFrom<Job | undefined>(
        this.rabbitMqJobClient.send({ cmd: 'get-job' }, jobId),
      );

      if (!job) throw new RpcException(`Job With ID: '${jobId}' Not Found.`);

      let application = await this.applicationRepository.findOne({
        where: {
          candidate: { id: userId },
          job: { id: jobId },
        },
        relations: ['candidate', 'job'],
      });

      if (application)
        throw new BadRequestException('You have applied for this position.');

      application = this.applicationRepository.create(createApplicationDto);

      await this.applicationRepository.save(application);

      await this.dataSource
        .createQueryBuilder()
        .relation(Application, 'candidate')
        .of(application.id)
        .set(userId);

      const { candidate, ...res } = application;

      const { password, ...resData } = candidate;

      return {
        ...res,
        candidate: resData,
      };
    } catch (err) {
      console.error(err);
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
    }
  };

  public handleGetApplication = async (applicationId: string) => {
    try {
      const application = await this.applicationRepository.findOneBy({
        id: applicationId,
      });

      if (!application)
        throw new RpcException(
          `Application With ID: '${applicationId}' Not Found.`,
        );

      return application;
    } catch (err) {
      console.error(err);
    }
  };

  public handleDeleteApplication = async (applicationId: string) => {
    try {
      const application = await this.applicationRepository.findOneBy({
        id: applicationId,
      });

      if (!application)
        throw new RpcException(
          `Application With ID: '${applicationId}' Not Found.`,
        );

      return { msg: 'Application deleted successfully.' };
    } catch (error) {
      console.error(error);
    }
  };

  public handleUpdateApplication = async (
    applicationId: string,
    updateApplicationDto: UpdateApplicationDto,
  ) => {
    try {
      const application = await this.applicationRepository.findOneBy({
        id: applicationId,
      });

      if (!application)
        throw new RpcException(
          `Application With ID: '${applicationId}' Not Found.`,
        );

      await this.applicationRepository.update(
        { id: applicationId },
        updateApplicationDto,
      );

      return await this.applicationRepository.findOneBy({ id: applicationId });
    } catch (err) {
      console.error(err);
    }
  };
}
