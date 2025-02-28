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
import { handleEncodedPassword } from 'libs/common/utils';
import { UrlResponseType } from 'libs/common/utils/types';
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
  ) {}

  public getUsers = async () => {
    return await this.userRepository.find({
      select: {
        id: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  };

  public createUser = async (createUserDto: CreateUserDto) => {
    const { password, type, email } = createUserDto;

    const { skills, ...createUserData } = createUserDto;

    const userWithEmail = await this.userRepository.findOneBy({ email });

    if (userWithEmail) throw new RpcException('Email has been existed.');

    const role = await this.handleGetRoleByName(type);

    const newUser = this.userRepository.create({
      ...createUserData,
      password: handleEncodedPassword(password),
      avatar_url:
        'https://res.cloudinary.com/daiqcjyk9/image/upload/v1735465375/default_user_logo_b1f7pd.png',
    });

    await this.userRepository.save(newUser);

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

    const { ACCOUNT_REGISTRATION } = NotificationTypes;

    const { title, description, key } = ACCOUNT_REGISTRATION;

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

  public handleGetUser = async (userId: string) => {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['role'],
      });

      if (!user) throw new RpcException('User Not Found.');

      const { password, ...res } = user;

      return res;
    } catch (err) {
      console.error(err);
    }
  };

  public handleUpdateUser = async (
    userId: string,
    updateUserDto: UpdateUserDto,
    avatar?: Express.Multer.File,
  ) => {
    try {
      const user = await this.userRepository.findOneBy({ id: userId });

      if (!user) throw new RpcException('User Not Found.');

      let avatar_url = '';

      if (avatar) {
        const [avatarElement] = await lastValueFrom<UrlResponseType[]>(
          this.rabbitMqUploadClient.send({ cmd: 'upload-files' }, [avatar]),
        );

        if (avatarElement) {
          avatar_url = avatarElement.url;
        }
      }

      await this.userRepository.update(
        { id: userId },
        {
          ...updateUserDto,
          ...(avatar_url !== ''
            ? {
                avatar_url,
              }
            : {}),
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

  public handleDeleteUser = async (userId: string) => {
    try {
      const user = await this.userRepository.findOneBy({ id: userId });

      if (!user) throw new RpcException('User Not Found.');

      await this.userRepository.delete({ id: userId });

      return { msg: 'User deleted successfully!' };
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
  ) => {
    try {
      const { recruiterIds, company_id: companyId } =
        assignCompanyToRecruitersDto;

      const company = await lastValueFrom<Company | null>(
        this.rabbitMqJobClient.send({ cmd: 'get-company' }, companyId),
      );

      if (!company)
        throw new RpcException(`Company With ID: '${companyId}' Not Found.`);

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
}
