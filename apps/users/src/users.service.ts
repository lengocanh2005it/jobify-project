import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Company } from 'apps/jobs/src/entities';
import { Role, Skill, User } from 'apps/users/src/entities';
import * as bcrypt from 'bcrypt';
import {
  CANDIDATE_APPLICATION_LIMIT,
  CANDIDATE_PREMIUM_LIMIT,
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
import {
  CreateSocialAccount,
  generateRpcExceptionResponse,
  handleEncodedPassword,
  UrlResponseType,
} from 'libs/common/utils';
import { omit } from 'lodash';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { lastValueFrom } from 'rxjs';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Role) private readonly roleRepository: Repository<Role>,
    @InjectDataSource() private readonly dataSource: DataSource,
    @Inject('NOTIFICATIONS_SERVICE')
    private readonly rabbitMqNotificationClient: ClientProxy,
    @InjectRepository(Skill)
    private readonly skillRepository: Repository<Skill>,
    @Inject('EMAILS_SERVICE') private readonly rabbitMqEmailClient: ClientProxy,
    @Inject('JOBS_SERVICE') private readonly rabbitMqJobClient: ClientProxy,
    @Inject('UPLOADS_SERVICE')
    private readonly rabbitMqUploadClient: ClientProxy,
    @Inject('APPLICATIONS_SERVICE')
    private readonly rabbitMqApplicationClient: ClientProxy,
    private readonly configService: ConfigService,
  ) {}

  public getUsers = async (query: PaginateQuery) => {
    const qb = this.userRepository
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
      ]);

    const search = query.search;

    if (search) {
      if (search.includes(':')) {
        const [column, value] = search.split(':').map((s) => s.trim());

        const allowedColumns = [
          'email',
          'full_name',
          'address',
          'phone_number',
          'role.name',
        ];

        if (allowedColumns.includes(column)) {
          if (column === 'role.name') {
            qb.andWhere(`role.name LIKE :value`, { value: `%${value}%` });
          } else {
            qb.andWhere(`user.${column} LIKE :value`, { value: `%${value}%` });
          }
        }
      } else {
        qb.andWhere(
          `(
            user.email LIKE :search OR 
            user.full_name LIKE :search OR 
            user.address LIKE :search OR 
            user.phone_number LIKE :search OR 
            user.bio LIKE :search OR
            role.name LIKE :search
          )`,
          { search: `%${search}%` },
        );
      }
    }

    qb.andWhere('role.name != :roleName', { roleName: 'admin' });

    return paginate(query, qb, {
      sortableColumns: ['id', 'email'],
      defaultSortBy: [['id', 'ASC']],
      maxLimit: 100,
      select: query.select ?? [],
    });
  };

  public createUser = async (
    createUserDto: CreateUserDto,
    files?: Array<Express.Multer.File>,
  ) => {
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

    const userWithEmail = await this.userRepository.findOneBy({ email });

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
          this.rabbitMqUploadClient.send({ cmd: 'upload-files' }, [avatarFile]),
        );

        if (file && file.url) {
          avatarFileUrl = file.url;
        }
      }
    }

    const newUser = this.userRepository.create({
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

    await this.userRepository.save(newUser);

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
        let findSkill = await this.skillRepository.findOneBy({ name: skill });

        if (!findSkill) {
          findSkill = this.skillRepository.create({ name: skill });

          await this.skillRepository.save(findSkill);
        }

        await this.dataSource
          .createQueryBuilder()
          .relation(Skill, 'users')
          .of(findSkill.id)
          .add(newUser.id);
      }
    }

    await this.dataSource
      .createQueryBuilder()
      .relation(User, 'role')
      .of(newUser.id)
      .set(role.id);

    const { password: passwordUser, ...res } = newUser;

    const { title, description, key } = NotificationTypes.ACCOUNT_REGISTRATION;

    this.rabbitMqNotificationClient.emit('create-notification', {
      data: {
        title,
        message: description,
        type: key,
      },
      userIds: [newUser.id],
    });

    return res;
  };

  public handleVerifyUser = async (loginDto: LoginDto) => {
    const { email, password } = loginDto;

    const findUser = await this.userRepository.findOne({
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
          `Password is'nt correct.`,
        ),
      );

    return omit(findUser, ['password']);
  };

  public handleGetRoleByName = async (roleName: string) => {
    const role = await this.roleRepository.findOneBy({ name: roleName });

    if (!role)
      throw new RpcException(
        generateRpcExceptionResponse(HttpStatus.NOT_FOUND, 'Role not found.'),
      );

    return role;
  };

  public handleGetProfile = async (userId: string) => {
    const user = await this.userRepository.findOne({
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
  };

  public handleGetUser = async (userId: string, user: User) => {
    const { id, role } = user;

    const findUser = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
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
  };

  public handleUpdateUser = async (
    userId: string,
    updateUserDto: UpdateUserDto,
    user: User,
    files?: Array<Express.Multer.File>,
  ) => {
    const findUser = await this.userRepository.findOne({
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
        await this.userRepository.findOne({
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
            let newSkill = await this.skillRepository.findOne({
              where: {
                name: skill,
              },
            });

            if (!newSkill) {
              newSkill = this.skillRepository.create({
                name: skill,
              });

              await this.skillRepository.save(newSkill);
            }

            await this.dataSource
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
          const findSkill = await this.skillRepository.findOne({
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

          await this.dataSource
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

    await this.userRepository.update(
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

    const savedUser = (await this.userRepository.findOne({
      where: {
        id: userId,
      },
      relations: ['skills'],
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

    return {
      ...omit(savedUser, ['password']),
      skills: savedUser.skills.map((skill) => skill.name),
    };
  };

  public handleDeleteUser = async (userId: string, user: User) => {
    const findUser = await this.userRepository.findOneBy({ id: userId });

    if (!findUser)
      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.NOT_FOUND,
          `User with id: '${userId}' not found.`,
        ),
      );

    const { role } = user;

    if (role.name === 'recruiter') {
      const result = this.rabbitMqApplicationClient.send(
        { cmd: 'delete-user-from-application' },
        userId,
      );

      return result;
    } else {
      await this.userRepository.delete({ id: userId });

      return {
        success: 'User deleted successfully!',
      };
    }
  };

  public handleGetPasswordOfUser = async (userId: string) => {
    const user = await this.userRepository.findOne({
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
  };

  public handleUpdatePassword = async (newPassword: string, userId: string) => {
    const user = await this.userRepository.findOneBy({ id: userId });

    if (!user)
      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.NOT_FOUND,
          `User with id: '${userId}' not found.`,
        ),
      );

    await this.userRepository.update(
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
  };

  public handleGetUsersMatchedRequirements = async (requirements: string[]) => {
    const skills = SKILL_KEYWORDS.filter((key) =>
      requirements.some((req) => req.toLowerCase().includes(key.toLowerCase())),
    );

    return (await this.userRepository.find({ relations: ['skills'] })).filter(
      (user) =>
        user.skills.some((userSkill) =>
          skills.some(
            (skill) => userSkill.name.toLowerCase() === skill.toLowerCase(),
          ),
        ),
    );
  };

  public handleUpdatePremium = async (userId: string) => {
    const user = await this.userRepository.findOne({
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

    const { title, key, description } = NotificationTypes.PREMIUM_PAID_SUCCESS;

    await this.userRepository.update(
      { id: userId },
      {
        is_premium: true,
        premium_expiry: premiumExpiry,
        ...(user.role.name === 'recruiter'
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
      type: 'payment_successfully',
    });
  };

  public handleAssignCompanyToRecruiters = async (
    assignCompanyToRecruitersDto: AssignCompanyToRecruitersDto,
    user: User,
  ) => {
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
      const recruiter = await this.userRepository.findOne({
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
        await this.userRepository
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
  };

  public handleGetUserByField = async (field: string, value: string) => {
    const user = await this.userRepository.findOne({
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
  };

  public handleGetUserJwt = async (userId: string) => {
    const user = await this.userRepository.findOne({
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
  };

  public handleUpdateUserLimit = async (
    userId: string,
    type: 'increase' | 'decrease',
  ) => {
    const user = await this.userRepository.findOne({
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

    await this.userRepository.update({ id: userId }, updatedFields);
  };

  private uploadFile = async (file?: Express.Multer.File) => {
    if (!file) return '';

    const [uploaded] = await lastValueFrom<UrlResponseType[]>(
      this.rabbitMqUploadClient.send({ cmd: 'upload-files' }, [file]),
    );

    return uploaded?.url || '';
  };

  public handleCreateSocialAccount = async (
    createSocialAccount: CreateSocialAccount,
  ) => {
    const {
      role,
      socialLogin: { provider, provider_id, email, full_name, avatar_url },
    } = createSocialAccount;

    let existingUser = await this.userRepository.findOne({
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

    existingUser = this.userRepository.create({
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

    await this.userRepository.save(existingUser);

    existingUser = await this.userRepository.findOne({
      where: {
        provider_id,
      },
      relations: ['role'],
    });

    return omit(existingUser, ['password']);
  };

  public handleCheckExistedSocialAccount = async (
    provider: Provider,
    provider_id: string,
    email?: string,
  ) => {
    let user: User | null = null;

    if (email) {
      user = await this.userRepository.findOne({
        where: {
          email,
        },
        relations: ['role'],
      });

      if (
        (user && user.provider !== provider) ||
        (user && user.provider === provider && user.provider_id !== provider_id)
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

    user = await this.userRepository.findOne({
      where: {
        provider,
        provider_id,
      },
      relations: ['role'],
    });

    if (user) return omit(user, ['password']);

    return null;
  };
}
