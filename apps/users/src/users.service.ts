import { HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { Company } from 'apps/jobs/src/entities';
import { Role, Skill, User } from 'apps/users/src/entities';
import * as bcrypt from 'bcrypt';
import {
  CANDIDATE_APPLICATION_LIMIT,
  CANDIDATE_PREMIUM_LIMIT,
  ElasticIndexes,
  EmailType,
  NotificationTypes,
  Provider,
  RECRUITER_JOB_LIMIT,
  RECRUITER_PREMIUM_LIMIT,
  Role as RoleEnum,
  SKILL_KEYWORDS,
} from 'libs/common/constants';
import {
  AssignCompanyToRecruitersDto,
  CreateUserDto,
  LoginDto,
  UpdateUserDto,
} from 'libs/common/dtos';
import { TransactionsProvider } from 'libs/common/providers';
import {
  CreateSocialAccount,
  generateRpcExceptionResponse,
  handleEncodedPassword,
  UrlResponseType,
} from 'libs/common/utils';
import { omit } from 'lodash';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { lastValueFrom } from 'rxjs';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @Inject('NOTIFICATIONS_SERVICE')
    private readonly rabbitMqNotificationClient: ClientProxy,
    @Inject('EMAILS_SERVICE') private readonly rabbitMqEmailClient: ClientProxy,
    @Inject('JOBS_SERVICE') private readonly rabbitMqJobClient: ClientProxy,
    @Inject('UPLOADS_SERVICE')
    private readonly rabbitMqUploadClient: ClientProxy,
    @Inject('APPLICATIONS_SERVICE')
    private readonly rabbitMqApplicationClient: ClientProxy,
    private readonly configService: ConfigService,
    private readonly transactionsProvider: TransactionsProvider,
    private readonly elasticsearchService: ElasticsearchService,
  ) {}

  async onModuleInit() {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const userRepository = queryRunner.manager.getRepository(User);
      return this.handleSyncUsersToElasticSearch(userRepository);
    });
  }

  public getUsers = async (query: PaginateQuery) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      try {
        const userRepository = queryRunner.manager.getRepository(User);

        let userIds: string[] | null = null;

        const search = query.search;

        if (search) {
          let field = 'email';

          let value = search;

          if (search.includes(':')) {
            const [searchField, searchValue] = search.split(':');

            field = searchField.trim();

            value = searchValue.trim();
          }

          const { hits } = await this.elasticsearchService.search({
            index: ElasticIndexes.USERS,
            body: {
              query: {
                bool: {
                  should:
                    field === 'email'
                      ? value.includes('@')
                        ? [{ term: { 'email.keyword': value } }]
                        : [{ wildcard: { email: `*${value}*` } }]
                      : [
                          { match_phrase: { [field]: value } },
                          { wildcard: { [field]: `*${value}*` } },
                        ],
                },
              },
            },
          });

          userIds = hits.hits.map(
            (hit) => (hit._source as Partial<User>).id as string,
          );
        }

        const qb = userRepository
          .createQueryBuilder('user')
          .leftJoinAndSelect('user.role', 'role')
          .select([
            'user.id',
            'user.email',
            'user.address',
            'user.full_name',
            'user.phone_number',
            'user.bio',
            'user.avatar_url',
            'user.is_premium',
            'user.expected_salary',
            'user.premium_expiry',
            'user.createdAt',
            'role.name',
          ])
          .andWhere('role.name != :roleName', { roleName: 'admin' });

        if (userIds && userIds.length > 0) {
          qb.andWhere('user.id IN (:...userIds)', { userIds });
        }

        return paginate(query, qb, {
          sortableColumns: ['id', 'email'],
          defaultSortBy: [['id', 'ASC']],
          maxLimit: 100,
          select: query.select ?? [],
        });
      } catch (err) {
        if (err?.meta?.statusCode === 404) return [];
        console.error('Elasticsearch search error: ', err);
        throw err;
      }
    });
  };

  public createUser = async (
    createUserDto: CreateUserDto,
    files?: Array<Express.Multer.File>,
  ) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const userRepository = queryRunner.manager.getRepository(User);
      const skillRepository = queryRunner.manager.getRepository(Skill);

      const { password, type, email } = createUserDto;

      if (type === 'admin')
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.BAD_REQUEST,
            `You cannot register an admin account.`,
          ),
        );

      const { skills, createCompanyDto, certifications, ...createUserData } =
        createUserDto;

      if (type === 'candidate' && createCompanyDto)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.BAD_REQUEST,
            `Candidate can't be belongs to specific company.`,
          ),
        );

      const userWithEmail = await userRepository.findOneBy({ email });

      if (userWithEmail)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.BAD_REQUEST,
            'Email has been existed.',
          ),
        );

      if (createCompanyDto && type !== 'recruiter')
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.FORBIDDEN,
            `Only recruiter can have permission to create company.`,
          ),
        );

      if (type === 'recruiter' && !createCompanyDto)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.BAD_REQUEST,
            `Recruiter must be provide the profile of company.`,
          ),
        );

      const role = await this.handleGetRoleByName(type);

      let cvFileUrl = '';

      let avatarFileUrl = '';

      if (files) {
        const cvFile = files.find((file) => file.fieldname === 'cv');

        const avatarFile = files.find((file) => file.fieldname === 'avatar');

        if (cvFile) {
          const [file] = await lastValueFrom<UrlResponseType[]>(
            this.rabbitMqUploadClient.send({ cmd: 'upload-files' }, [cvFile]),
          );

          if (file && file.url) {
            cvFileUrl = file.url;
          }
        }

        if (avatarFile) {
          const [file] = await lastValueFrom<UrlResponseType[]>(
            this.rabbitMqUploadClient.send({ cmd: 'upload-files' }, [
              avatarFile,
            ]),
          );

          if (file && file.url) {
            avatarFileUrl = file.url;
          }
        }
      }

      let newUser = userRepository.create({
        ...createUserData,
        ...(certifications && {
          certifications: JSON.parse(certifications) as string[],
        }),
        password: handleEncodedPassword(password),
        avatar_url: avatarFileUrl
          ? avatarFileUrl
          : this.configService.get<string>('default_user_logo'),
        ...(cvFileUrl ? { resume_link: cvFileUrl } : {}),
        ...(type === 'recruiter'
          ? { job_posted_count: RECRUITER_JOB_LIMIT }
          : type === 'candidate'
            ? { application_applied_count: CANDIDATE_APPLICATION_LIMIT }
            : {}),
      });

      await userRepository.save(newUser);

      if (createCompanyDto && type === 'recruiter') {
        const data = await lastValueFrom<Company>(
          this.rabbitMqJobClient.send(
            { cmd: 'create-company' },
            {
              createCompanyDto: JSON.parse(createCompanyDto),
              userId: newUser.id,
            },
          ),
        );

        if (!data)
          throw new RpcException(
            generateRpcExceptionResponse(
              HttpStatus.INTERNAL_SERVER_ERROR,
              'Failed when creating new company.',
            ),
          );
      }

      if (skills && (JSON.parse(skills) as string[]).length) {
        for (const skill of skills) {
          let findSkill = await skillRepository.findOneBy({ name: skill });

          if (!findSkill) {
            findSkill = skillRepository.create({ name: skill });

            await skillRepository.save(findSkill);
          }

          await skillRepository
            .createQueryBuilder()
            .relation(Skill, 'users')
            .of(findSkill.id)
            .add(newUser.id);
        }
      }

      newUser.role = role;

      await userRepository.save(newUser);

      const { title, description, key } =
        NotificationTypes.ACCOUNT_REGISTRATION;

      this.rabbitMqNotificationClient.emit('create-notification', {
        data: {
          title,
          message: description,
          type: key,
        },
        userIds: [newUser.id],
      });

      newUser = (await userRepository.findOne({
        where: {
          id: newUser.id,
        },
        relations: ['role'],
      })) as User;

      await this.elasticsearchService.index({
        index: ElasticIndexes.USERS,
        id: newUser.id,
        body: {
          ...omit(newUser, ['password']),
          role: newUser.role.name,
        },
      });

      return omit(newUser, ['password']);
    });
  };

  public handleVerifyUser = async (loginDto: LoginDto) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const userRepository = queryRunner.manager.getRepository(User);

      const { email, password } = loginDto;

      const findUser = await userRepository.findOne({
        where: { email },
        relations: ['role'],
      });

      if (!findUser)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.BAD_REQUEST,
            `User with email: '${loginDto.email}' not found.`,
          ),
        );

      const isMatchPassword = await bcrypt.compare(
        password,
        findUser?.password ? findUser.password : '',
      );

      if (!isMatchPassword)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.BAD_REQUEST,
            `Password isn't correct.`,
          ),
        );

      return omit(findUser, ['password']);
    });
  };

  public handleGetRoleByName = async (roleName: string) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const roleRepository = queryRunner.manager.getRepository(Role);

      const role = await roleRepository.findOneBy({ name: roleName });

      if (!role)
        throw new RpcException(
          generateRpcExceptionResponse(HttpStatus.NOT_FOUND, 'Role not found.'),
        );

      return role;
    });
  };

  public handleGetProfile = async (userId: string) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const userRepository = queryRunner.manager.getRepository(User);

      const user = await userRepository.findOne({
        where: { id: userId },
        relations: [
          'role',
          'userNotifications',
          'userNotifications.notification',
          'skills',
        ],
      });

      if (!user)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.NOT_FOUND,
            `User with id: '${userId}' not found.`,
          ),
        );

      const { password, userNotifications, ...res } = user;

      return {
        ...res,
        role: user.role.name,
        notifications: userNotifications
          .map((un) => un.notification)
          .map((n) => ({
            id: n.id,
            title: n.title,
            message: n.message,
          })),
        skills: user.skills.map((sk) => sk.name),
        expected_salary: Number(res.expected_salary),
      };
    });
  };

  public handleGetUser = async (userId: string, user: User) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const userRepository = queryRunner.manager.getRepository(User);

      const { id, role } = user;

      const findUser = await userRepository.findOne({
        where: {
          id: userId,
        },
        relations: ['applications'],
      });

      if (!findUser)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.NOT_FOUND,
            `User with id: '${userId}' not found.`,
          ),
        );

      if (findUser.id !== id && role.name === 'user')
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.FORBIDDEN,
            `You can have only get profile yourself.`,
          ),
        );

      if (
        !findUser.applications.some((app) => app.job.recruiter.id === id) &&
        role.name === 'recruiter'
      )
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.FORBIDDEN,
            'You can have only get profile of candidates that they applied for job you posted.',
          ),
        );

      return omit(findUser, ['password']);
    });
  };

  public handleUpdateUser = async (
    userId: string,
    updateUserDto: UpdateUserDto,
    user: User,
    files?: Array<Express.Multer.File>,
  ) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const userRepository = queryRunner.manager.getRepository(User);
      const skillRepository = queryRunner.manager.getRepository(Skill);

      const findUser = await userRepository.findOne({
        where: { id: userId },
        relations: ['skills'],
      });

      if (!findUser)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.NOT_FOUND,
            `User with id: '${userId}' not found.`,
          ),
        );

      const { id, role } = user;

      if (findUser.id !== id && role.name !== 'admin')
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.FORBIDDEN,
            'You can only update profile yourself.',
          ),
        );

      if (
        (!updateUserDto || !Object.keys(updateUserDto).length) &&
        !files?.length
      )
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.BAD_REQUEST,
            'You must be provide some information to update your profile.',
          ),
        );

      const {
        skills,
        updateCompanyDto,
        expected_salary,
        certifications,
        user_id,
        ...resUpdateUserDto
      } = updateUserDto;

      if (role.name === 'admin' && !user_id)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.BAD_REQUEST,
            `Please provide the user_id you want to update their profile.`,
          ),
        );

      let cvFileUrl = '';
      let avatarFileUrl = '';

      if (files) {
        const cvFile = files.find((file) => file.fieldname === 'cv');

        const avatarFile = files.find((file) => file.fieldname === 'avatar');

        cvFileUrl = await this.uploadFile(cvFile);

        avatarFileUrl = await this.uploadFile(avatarFile);
      }

      if (updateCompanyDto && role.name === 'candidate')
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.FORBIDDEN,
            `Only the recruiter can have permission to update company.`,
          ),
        );

      if (updateCompanyDto && role.name === 'recruiter') {
        this.rabbitMqJobClient.emit('update-company', {
          updateCompanyDto: JSON.parse(updateCompanyDto),
          recruiterId: userId,
        });
      }

      if (skills && (JSON.parse(skills) as string[]).length) {
        const existingSkillsOfUser = (
          await userRepository.findOne({
            where: {
              id: userId,
            },
            relations: ['skills'],
          })
        )?.skills;

        if (existingSkillsOfUser && existingSkillsOfUser.length) {
          for (const skill of JSON.parse(skills) as string[]) {
            if (
              !existingSkillsOfUser.map((skill) => skill.name).includes(skill)
            ) {
              let newSkill = await skillRepository.findOne({
                where: {
                  name: skill,
                },
              });

              if (!newSkill) {
                newSkill = skillRepository.create({
                  name: skill,
                });

                await skillRepository.save(newSkill);
              }

              await userRepository
                .createQueryBuilder()
                .relation(Skill, 'users')
                .of(newSkill.id)
                .add(userId);
            }
          }

          const excludeSkills = existingSkillsOfUser
            .map((skill) => skill.name)
            .filter((el) => !(JSON.parse(skills) as string[]).includes(el));

          for (const skill of excludeSkills) {
            const findSkill = await skillRepository.findOne({
              where: {
                name: skill,
              },
            });

            if (!findSkill)
              throw new RpcException(
                generateRpcExceptionResponse(
                  HttpStatus.NOT_FOUND,
                  `Skill with name: '${skill}' not found.`,
                ),
              );

            await userRepository
              .createQueryBuilder()
              .relation(User, 'skills')
              .of(user.id)
              .remove(findSkill.id);
          }
        }
      }

      let formattedCertifications: string[] = [];

      if (certifications) {
        formattedCertifications = JSON.parse(certifications) as string[];
      }

      await userRepository.update(
        { id: userId },
        {
          ...resUpdateUserDto,
          ...(formattedCertifications && formattedCertifications.length
            ? { certifications: formattedCertifications }
            : {}),
          ...(expected_salary && { expected_salary: Number(expected_salary) }),
          ...(avatarFileUrl ? { avatar_url: avatarFileUrl } : {}),
          ...(cvFileUrl ? { resume_link: cvFileUrl } : {}),
        },
      );

      const savedUser = (await userRepository.findOne({
        where: {
          id: userId,
        },
        relations: ['skills', 'role'],
      })) as User;

      const { title, description, key } = NotificationTypes.PROFILE_UPDATE;

      this.rabbitMqNotificationClient.emit('create-notification', {
        data: {
          title,
          message: description,
          type: key,
        },
        userIds: [savedUser.id],
      });

      await this.elasticsearchService.index({
        index: ElasticIndexes.USERS,
        id: savedUser.id,
        body: {
          id: savedUser.id,
          email: savedUser.email,
          phone_number: savedUser.phone_number,
          full_name: savedUser.full_name,
          bio: savedUser.bio,
          avatar_url: savedUser.avatar_url,
          is_premium: savedUser.is_premium,
          expected_salary: savedUser.expected_salary,
          premium_expiry: savedUser.premium_expiry,
          createdAt: savedUser.createdAt,
          role: savedUser.role.name,
        },
      });

      return {
        ...omit(savedUser, ['password']),
        skills: savedUser.skills.map((skill) => skill.name),
        role: savedUser.role.name,
      };
    });
  };

  public handleDeleteUser = async (
    userId: string,
    user: User,
    applicationId?: string,
  ) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const userRepository = queryRunner.manager.getRepository(User);

      let findUser: User | null = null;

      try {
        const response = await this.elasticsearchService.get<User>({
          index: ElasticIndexes.USERS,
          id: userId,
        });

        if (!response.found || !response._source) {
          throw new RpcException(
            generateRpcExceptionResponse(
              HttpStatus.NOT_FOUND,
              `User with id: '${userId}' not found.`,
            ),
          );
        }

        findUser = response._source;
      } catch (error) {
        if (error.name === 'ResponseError' && error.meta?.statusCode === 404) {
          throw new RpcException(
            generateRpcExceptionResponse(
              HttpStatus.NOT_FOUND,
              `User with id: '${userId}' not found.`,
            ),
          );
        }
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            `Failed to fetch user: ${error.message}`,
          ),
        );
      }

      const { role } = user;

      if (role.name === 'recruiter' && !applicationId) {
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.BAD_REQUEST,
            `Please provide the applicationId of the candidate you want to remove from the list of applicants for the job you posted.`,
          ),
        );
      }

      if (role.name === 'recruiter') {
        const result = await lastValueFrom(
          this.rabbitMqApplicationClient.send(
            { cmd: 'delete-user-from-application' },
            { userId, applicationId },
          ),
        );
        return result;
      } else {
        this.rabbitMqEmailClient.emit('send-email', {
          email: findUser.email,
          type: EmailType.ACCOUNT_DELETE,
        });

        findUser = (await userRepository.findOne({
          where: {
            id: findUser.id,
          },
          relations: ['skills'],
        })) as User;

        if (findUser?.skills.length) {
          await userRepository
            .createQueryBuilder('user')
            .relation(User, 'skills')
            .of(findUser.id)
            .remove(findUser.skills.map((skill) => skill.id));
        }

        await userRepository.delete({ id: userId });

        await this.elasticsearchService.delete({
          index: ElasticIndexes.USERS,
          id: userId,
        });

        return {
          success: `User with id: '${userId}' deleted successfully.`,
        };
      }
    });
  };

  public handleGetPasswordOfUser = async (userId: string) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const userRepository = queryRunner.manager.getRepository(User);

      const user = await userRepository.findOne({
        where: { id: userId },
        select: {
          id: true,
          password: true,
          email: true,
        },
      });

      if (!user)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.NOT_FOUND,
            `User with id: '${userId}' not found.`,
          ),
        );

      return user;
    });
  };

  public handleUpdatePassword = async (newPassword: string, userId: string) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const userRepository = queryRunner.manager.getRepository(User);

      const user = await userRepository.findOneBy({ id: userId });

      if (!user)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.NOT_FOUND,
            `User with id: '${userId}' not found.`,
          ),
        );

      await userRepository.update(
        { id: userId },
        {
          password: handleEncodedPassword(newPassword),
        },
      );

      const { PASSWORD_RESET } = NotificationTypes;

      const { title, description, key } = PASSWORD_RESET;

      this.rabbitMqNotificationClient.emit('create-notification', {
        data: {
          title,
          message: description,
          type: key,
        },
        userIds: [userId],
      });

      return {
        message: 'Password updated successfully.',
      };
    });
  };

  public handleGetUsersMatchedRequirements = async (requirements: string[]) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const userRepository = queryRunner.manager.getRepository(User);

      const skills = SKILL_KEYWORDS.filter((key) =>
        requirements.some((req) =>
          req.toLowerCase().includes(key.toLowerCase()),
        ),
      );

      return (await userRepository.find({ relations: ['skills'] })).filter(
        (user) =>
          user.skills.some((userSkill) =>
            skills.some(
              (skill) => userSkill.name.toLowerCase() === skill.toLowerCase(),
            ),
          ),
      );
    });
  };

  public handleUpdatePremium = async (userId: string) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const userRepository = queryRunner.manager.getRepository(User);

      const user = await userRepository.findOne({
        where: { id: userId },
        relations: ['role'],
      });

      if (!user)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.NOT_FOUND,
            `User with id: '${userId}' not found.`,
          ),
        );

      const now = new Date();

      let premiumExpiry = new Date();

      if (user.premium_expiry) {
        premiumExpiry = new Date(user.premium_expiry);

        premiumExpiry.setDate(premiumExpiry.getDate() + 30);
      } else {
        premiumExpiry.setDate(now.getDate() + 30);
      }

      const { title, key, description } =
        NotificationTypes.PREMIUM_PAID_SUCCESS;

      await userRepository.update(
        { id: userId },
        {
          is_premium: true,
          premium_expiry: premiumExpiry,
          ...(user?.role?.name === 'recruiter'
            ? {
                job_posted_count: RECRUITER_PREMIUM_LIMIT,
              }
            : user.role.name === 'candidate'
              ? {
                  application_applied_count: CANDIDATE_PREMIUM_LIMIT,
                }
              : {}),
        },
      );

      this.rabbitMqNotificationClient.emit('create-notification', {
        data: {
          title,
          type: key,
          message: description,
        },
        userIds: [userId],
      });

      this.rabbitMqEmailClient.emit('send-email', {
        email: user.email,
        type: EmailType.PAYMENT_SUCCESSFULLY,
      });
    });
  };

  public handleAssignCompanyToRecruiters = async (
    assignCompanyToRecruitersDto: AssignCompanyToRecruitersDto,
    user: User,
  ) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const userRepository = queryRunner.manager.getRepository(User);

      const { recruiterIds, company_id: companyId } =
        assignCompanyToRecruitersDto;

      const company = await lastValueFrom<Company | null>(
        this.rabbitMqJobClient.send({ cmd: 'get-company' }, companyId),
      );

      if (!company)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.NOT_FOUND,
            `Company with id: '${companyId}' not found.`,
          ),
        );

      const { id, role } = user;

      if (
        !company.recruiters.some((re) => re.id === id) &&
        role.name === 'recruiter'
      )
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.FORBIDDEN,
            'You can only assign other recruiters to the company that you belongs to.',
          ),
        );

      for (const recruiterId of recruiterIds) {
        const recruiter = await userRepository.findOne({
          where: {
            id: recruiterId,
          },
          relations: ['company', 'role'],
        });

        if (!recruiter)
          throw new RpcException(
            generateRpcExceptionResponse(
              HttpStatus.NOT_FOUND,
              `User with id: '${recruiterId}' not found.`,
            ),
          );

        if (recruiter.role.name !== 'recruiter')
          throw new RpcException(
            generateRpcExceptionResponse(
              HttpStatus.FORBIDDEN,
              `Only recruiter can be assigned to the company.`,
            ),
          );

        if (!recruiter.company) {
          await userRepository
            .createQueryBuilder()
            .relation(User, 'company')
            .of(recruiter.id)
            .set(company.id);
        } else {
          throw new RpcException(
            generateRpcExceptionResponse(
              HttpStatus.BAD_REQUEST,
              `Recruiter with id: '${recruiterId}' has already been assigned to another company.`,
            ),
          );
        }
      }

      return {
        message: 'Assigned these recruiters to this company successfully.',
      };
    });
  };

  public handleGetUserByField = async (field: string, value: string) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const userRepository = queryRunner.manager.getRepository(User);

      const user = await userRepository.findOne({
        where: {
          [field]: value,
        },
        select: {
          id: true,
          email: true,
          full_name: true,
          phone_number: true,
          address: true,
        },
      });

      return user;
    });
  };

  public handleGetUserJwt = async (userId: string) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const userRepository = queryRunner.manager.getRepository(User);

      const user = await userRepository.findOne({
        where: {
          id: userId,
        },
        relations: ['role', 'company'],
      });

      if (!user)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.NOT_FOUND,
            `User with id: '${userId}' not found.`,
          ),
        );

      return omit(user, ['password']);
    });
  };

  public handleUpdateUserLimit = async (
    userId: string,
    type: 'increase' | 'decrease',
  ) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const userRepository = queryRunner.manager.getRepository(User);

      const user = await userRepository.findOne({
        where: {
          id: userId,
        },
        relations: ['role'],
      });

      if (!user)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.NOT_FOUND,
            `User with id: '${userId}' not found.`,
          ),
        );

      const isRecruiter = user.role?.name === 'recruiter';

      const updatedFields = isRecruiter
        ? {
            job_posted_count:
              (user.job_posted_count ?? 0) + (type === 'increase' ? 1 : -1),
          }
        : {
            application_applied_count:
              (user.application_applied_count ?? 0) +
              (type === 'increase' ? 1 : -1),
          };

      await userRepository.update({ id: userId }, updatedFields);
    });
  };

  private uploadFile = async (file?: Express.Multer.File) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      if (!file) return '';

      const [uploaded] = await lastValueFrom<UrlResponseType[]>(
        this.rabbitMqUploadClient.send({ cmd: 'upload-files' }, [file]),
      );

      return uploaded?.url || '';
    });
  };

  public handleCreateSocialAccount = async (
    createSocialAccount: CreateSocialAccount,
  ) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const userRepository = queryRunner.manager.getRepository(User);

      const {
        role,
        socialLogin: { provider, provider_id, email, full_name, avatar_url },
      } = createSocialAccount;

      let existingUser = await userRepository.findOne({
        where: {
          email,
        },
        relations: ['role'],
      });

      if (existingUser)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.BAD_REQUEST,
            `Email: '${email}' has already been used by another account.`,
          ),
        );

      existingUser = userRepository.create({
        provider,
        provider_id,
        ...(email && { email }),
        full_name,
        ...(avatar_url && { avatar_url }),
        ...(role === RoleEnum.RECRUITER
          ? { job_posted_count: RECRUITER_JOB_LIMIT }
          : role === RoleEnum.CANDIDATE
            ? { application_applied_count: CANDIDATE_APPLICATION_LIMIT }
            : {}),
      });

      const findRole = await this.handleGetRoleByName(role);

      existingUser.role = findRole;

      await userRepository.save(existingUser);

      existingUser = await userRepository.findOne({
        where: {
          provider_id,
        },
        relations: ['role'],
      });

      return omit(existingUser, ['password']);
    });
  };

  public handleCheckExistedSocialAccount = async (
    provider: Provider,
    provider_id: string,
    email?: string,
  ) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const userRepository = queryRunner.manager.getRepository(User);

      let user: User | null = null;

      if (email) {
        user = await userRepository.findOne({
          where: {
            email,
          },
          relations: ['role'],
        });

        if (
          (user && user.provider !== provider) ||
          (user &&
            user.provider === provider &&
            user.provider_id !== provider_id)
        )
          throw new RpcException(
            generateRpcExceptionResponse(
              HttpStatus.BAD_REQUEST,
              `Email '${email}' has already used by another account.`,
            ),
          );

        if (!user) return null;

        return omit(user, ['password']);
      }

      user = await userRepository.findOne({
        where: {
          provider,
          provider_id,
        },
        relations: ['role'],
      });

      if (user) return omit(user, ['password']);

      return null;
    });
  };

  private handleSyncUsersToElasticSearch = async (
    userRepository: Repository<User>,
  ) => {
    const users = await userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .getMany();

    const bulkBody = users.flatMap((user) => [
      { index: { _index: ElasticIndexes.USERS, _id: user.id } },
      {
        id: user.id,
        email: user.email,
        phone_number: user.phone_number,
        full_name: user.full_name,
        bio: user.bio,
        avatar_url: user.avatar_url,
        is_premium: user.is_premium,
        expected_salary: user.expected_salary,
        premium_expiry: user.premium_expiry,
        createdAt: user.createdAt,
        role: user.role.name,
      },
    ]);

    if (!bulkBody.length) {
      console.warn(
        '⚠️ Bulk request body is empty, skipping Elasticsearch sync.',
      );
      return;
    }

    const chunkSize = 1000;

    for (let i = 0; i < bulkBody.length; i += chunkSize) {
      await this.elasticsearchService.bulk({
        index: ElasticIndexes.USERS,
        body: bulkBody.slice(i, i + chunkSize),
        refresh: 'wait_for',
      });
    }
  };

  public handleCalculateStatisticsOfUsers = async () => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const userRepository = queryRunner.manager.getRepository(User);

      const [totalUsers, candidates, recruiters, admins] = await Promise.all([
        userRepository.count(),
        userRepository.count({
          where: { role: { name: 'candidate' } },
          relations: ['role'],
        }),
        userRepository.count({
          where: { role: { name: 'recruiter' } },
          relations: ['role'],
        }),
        userRepository.count({
          where: { role: { name: 'admin' } },
          relations: ['role'],
        }),
      ]);

      return { totalUsers, candidates, recruiters, admins };
    });
  };

  public handleGetTotalUsers = async () => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const userRepository = queryRunner.manager.getRepository(User);

      return userRepository.count();
    });
  };
}
