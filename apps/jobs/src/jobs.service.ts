import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Company } from 'apps/jobs/src/entities/companies.entity';
import { Job } from 'apps/jobs/src/entities/jobs.entity';
import { CreateCompanyDto } from 'libs/common/dtos/create-company.dto';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job) private readonly jobRepository: Repository<Job>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectDataSource() private readonly dataSource: DataSource,
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
      relations: ['recruiters'],
    })) as Company;

    return {
      ...res,
      recruiters: recruiters.map((recruiter) => {
        const { password, ...res } = recruiter;
        return res;
      }),
    };
  };
}
