import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Company } from 'apps/jobs/src/entities/companies.entity';
import { Role } from 'apps/users/src/entities/roles.entity';
import { Skill } from 'apps/users/src/entities/skills.entity';
import { User } from 'apps/users/src/entities/users.entity';
import * as bcrypt from 'bcrypt';
import { NotificationTypes } from 'libs/common/constants';
import { SKILL_KEYWORDS } from 'libs/common/constants/skills.constant';
import { CreateUserDto, LoginDto, UpdateUserDto } from 'libs/common/dtos';
import { AssignCompanyToRecruitersDto } from 'libs/common/dtos/assign-company-to-recruiters.dto';
import { UpdateCompanyDto } from 'libs/common/dtos/update-company.dto';
import { handleEncodedPassword } from 'libs/common/utils';
import { UrlResponseType } from 'libs/common/utils/types';
import { lastValueFrom } from 'rxjs';
import { DataSource, In, Repository } from 'typeorm';
import { Role as RoleEnum } from 'libs/common/constants';
import { ConfigService } from '@nestjs/config';

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

  public getUsers = async (user: User) => {
    const { id, role } = user;

    const recruiter = await this.userRepository.findOne({
      where: {
        id,
      },
      relations: ['jobs', 'jobs.applications', 'jobs.applications.candidate'],
    });

    const userIds: string[] = [];

    recruiter?.jobs.forEach((job) => {
      job.applications.forEach((app) => {
        userIds.push(app.candidate.id);
      });
    });

    return await this.userRepository.find({
      select: {
        id: true,
        email: true,
        phone_number: true,
        address: true,
        bio: true,
        full_name: true,
        avatar_url: true,
        skills: {
          name: true,
        },
        ...(role.name === 'admin'
          ? {
              createdAt: true,
              updatedAt: true,
              is_premium: true,
              expected_salary: true,
              premium_expiry: true,
              certifications: true,
            }
          : {}),
      },
      where:
        role.name === 'admin'
          ? {}
          : {
              id: In(userIds),
            },
    });
  };

  public createUser = async (
    createUserDto: CreateUserDto,
    files?: Array<Express.Multer.File>,
  ) => {
    const { password, type, email } = createUserDto;

    const { skills, createCompanyDto, ...createUserData } = createUserDto;

    const userWithEmail = await this.userRepository.findOneBy({ email });

    if (userWithEmail) throw new RpcException('Email has been existed.');

    if (createCompanyDto && type !== 'recruiter')
      throw new RpcException(
        `Only recruiter can have permission to create company.`,
      );

    if (type === 'recruiter' && !createCompanyDto)
      throw new RpcException(
        `Recruiter must be provide the profile of company.`,
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
      password: handleEncodedPassword(password),
      avatar_url: avatarFileUrl
        ? avatarFileUrl
        : this.configService.get<string>('default_user_logo'),
      ...(cvFileUrl ? { resume_link: cvFileUrl } : {}),
    });

    await this.userRepository.save(newUser);

    if (createCompanyDto && type === 'recruiter') {
      this.rabbitMqJobClient.send(
        { cmd: 'create-company' },
        {
          createCompanyDto: JSON.parse(createCompanyDto),
          userId: newUser.id,
        },
      );
    }

    if (skills && skills.length) {
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

    if (!findUser) throw new RpcException('User Not Found.');

    const isMatchPassword = await bcrypt.compare(password, findUser.password);

    if (!isMatchPassword) throw new RpcException('Password is not correct.');

    const { password: _passwordUser, ...res } = findUser;

    return res;
  };

  public handleGetRoleByName = async (roleName: string) => {
    const role = await this.roleRepository.findOneBy({ name: roleName });

    if (!role) throw new RpcException('Role Not Found.');

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

    if (!user) throw new RpcException('User Not Found.');

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
          is_read: n.is_read,
        })),
      skills: user.skills.map((sk) => sk.name),
      expected_salary: Number(res.expected_salary),
    };
  };

  public handleGetUser = async (userId: string, user: User) => {
    try {
      const { id, role } = user;

      const findUser = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['role'],
      });

      if (!findUser) throw new RpcException('User Not Found.');

      if (findUser.id !== id && role.name === 'user')
        throw new RpcException(`You can have only get profile yourself.`);

      if (
        !findUser.applications.some((app) => app.job.recruiter.id === id) &&
        role.name === 'recruiter'
      )
        throw new RpcException(
          'You can have only get profile of candidates that they applied for job you posted.',
        );

      const { password, ...res } = findUser;

      return res;
    } catch (err) {
      console.error(err);
    }
  };

  public handleUpdateUser = async (
    userId: string,
    updateUserDto: UpdateUserDto,
    user: User,
    files?: Array<Express.Multer.File>,
  ) => {
    try {
      const findUser = await this.userRepository.findOneBy({ id: userId });

      if (!findUser) throw new RpcException('User Not Found.');

      const { id, role } = user;

      if (findUser.id !== id && role.name !== 'admin')
        throw new RpcException('You can only update profile yourself.');

      let cvFileUrl = '';
      let avatarFileUrl = '';

      if (files) {
        const cvFile = files.find((file) => file.fieldname === 'cv');

        const avatarFile = files.find((file) => file.fieldname === 'avatar');

        cvFileUrl = await this.uploadFile(cvFile);

        avatarFileUrl = await this.uploadFile(avatarFile);
      }

      const { skills, updateCompanyDto, ...resUpdateUserDto } = updateUserDto;

      if (updateCompanyDto && role.name === 'candidate')
        throw new RpcException(
          `Only the recruiter can have permission to update company.`,
        );

      if (updateCompanyDto && role.name === 'recruiter') {
        this.rabbitMqJobClient.emit('update-company', {
          updateCompanyDto: JSON.parse(updateCompanyDto),
          recruiterId: userId,
        });
      }

      if (skills && skills.length) {
        const existingSkillsOfUser = (
          await this.userRepository.findOne({
            where: {
              id: userId,
            },
            relations: ['skills'],
          })
        )?.skills;

        if (existingSkillsOfUser && existingSkillsOfUser.length) {
          for (const skill of skills) {
            if (
              !existingSkillsOfUser.map((skill) => skill.name).includes(skill)
            ) {
              const newSkill = this.skillRepository.create({
                name: skill,
              });

              await this.skillRepository.save(newSkill);

              await this.dataSource
                .createQueryBuilder()
                .relation(Skill, 'user')
                .of(newSkill.id)
                .add(userId);
            }
          }
        }
      }

      await this.userRepository.update(
        { id: userId },
        {
          ...resUpdateUserDto,
          ...(avatarFileUrl ? { avatar_url: avatarFileUrl } : {}),
          ...(cvFileUrl ? { resume_link: cvFileUrl } : {}),
        },
      );

      const savedUser = (await this.userRepository.findOneBy({
        id: userId,
      })) as User;

      const { password, ...res } = savedUser;

      const { title, description, key } = NotificationTypes.PROFILE_UPDATE;

      this.rabbitMqNotificationClient.emit('create-notification', {
        data: {
          title,
          message: description,
          type: key,
        },
        userIds: [savedUser.id],
      });

      return res;
    } catch (err) {
      console.error(err);
    }
  };

  public handleDeleteUser = async (userId: string, user: User) => {
    try {
      const findUser = await this.userRepository.findOneBy({ id: userId });

      if (!findUser) throw new RpcException('User Not Found.');

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
    } catch (err) {
      console.error(err);
    }
  };

  public handleGetPasswordOfUser = async (userId: string) => {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        select: {
          id: true,
          password: true,
          email: true,
        },
      });

      if (!user) throw new RpcException(`User With ID: '${userId}' Not Found.`);

      return user;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  public handleUpdatePassword = async (newPassword: string, userId: string) => {
    try {
      const user = await this.userRepository.findOneBy({ id: userId });

      if (!user) throw new RpcException(`User With ID: '${userId}' Not Found.`);

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
    } catch (err) {
      console.error(err);
    }
  };

  public handleGetUsersMatchedRequirements = async (requirements: string[]) => {
    try {
      const skills = SKILL_KEYWORDS.filter((key) =>
        requirements.some((req) =>
          req.toLowerCase().includes(key.toLowerCase()),
        ),
      );

      return (await this.userRepository.find({ relations: ['skills'] })).filter(
        (user) =>
          user.skills.some((userSkill) =>
            skills.some(
              (skill) => userSkill.name.toLowerCase() === skill.toLowerCase(),
            ),
          ),
      );
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  public handleUpdatePremium = async (userId: string) => {
    try {
      const user = await this.userRepository.findOneBy({ id: userId });

      if (!user) throw new RpcException(`User With ID: '${userId}' Not Found.`);

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

      await this.userRepository.update(
        { id: userId },
        {
          is_premium: true,
          premium_expiry: premiumExpiry,
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
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  public handleAssignCompanyToRecruiters = async (
    assignCompanyToRecruitersDto: AssignCompanyToRecruitersDto,
    user: User,
  ) => {
    try {
      const { recruiterIds, company_id: companyId } =
        assignCompanyToRecruitersDto;

      const company = await lastValueFrom<Company | null>(
        this.rabbitMqJobClient.send({ cmd: 'get-company' }, companyId),
      );

      if (!company)
        throw new RpcException(`Company With ID: '${companyId}' Not Found.`);

      const { id, role } = user;

      if (
        !company.recruiters.some((re) => re.id === id) &&
        role.name === 'recruiter'
      )
        throw new RpcException(
          'You can only assign other recruiters to the company that you belongs to.',
        );

      for (const recruiterId of recruiterIds) {
        const recruiter = await this.userRepository.findOne({
          where: {
            id: recruiterId,
          },
          relations: ['company', 'role'],
        });

        if (!recruiter)
          throw new RpcException(`User With ID: '${recruiterId}' Not Found.`);

        if (recruiter.role.name !== 'recruiter')
          throw new RpcException(
            `Only recruiter can be assigned to the company.`,
          );

        if (!recruiter.company) {
          await this.userRepository
            .createQueryBuilder()
            .relation(User, 'company')
            .of(recruiter.id)
            .set(company.id);
        } else {
          throw new RpcException(
            `Recruiter with id: '${recruiterId}' has already assign to another company.`,
          );
        }
      }

      return {
        message: 'Assigned these recruiters to this company successfully.',
      };
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  public handleGetUserByField = async (field: string, value: string) => {
    try {
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
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  public handleGetUserJwt = async (userId: string) => {
    try {
      const user = await this.userRepository.findOne({
        where: {
          id: userId,
        },
        relations: ['role', 'company'],
      });

      if (!user) throw new RpcException(`User with id: '${userId}' not found.`);

      const { password, ...res } = user;

      return res;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  private uploadFile = async (file?: Express.Multer.File) => {
    if (!file) return '';

    const [uploaded] = await lastValueFrom<UrlResponseType[]>(
      this.rabbitMqUploadClient.send({ cmd: 'upload-files' }, [file]),
    );

    return uploaded?.url || '';
  };
}
