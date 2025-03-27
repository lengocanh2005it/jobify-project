import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { User } from 'apps/users/src/entities';
import { Request } from 'express';
import { Provider } from 'libs/common/constants';
import {
  CreateCompanyDto,
  CreateUserDto,
  ForgetPasswordDto,
  LoginDto,
  UpdatePasswordDto,
  VerifyNewDeviceDto,
} from 'libs/common/dtos';
import { CreateSocialAccount, RequestMetadata } from 'libs/common/utils';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    @Inject('AUTH_SERVICE') private readonly rabbitMqAuthClient: ClientProxy,
    @Inject('JOBS_SERVICE') private readonly rabbitMqJobClient: ClientProxy,
    @Inject('USERS_SERVICE') private readonly rabbitMqUserClient: ClientProxy,
  ) {}

  public handleLogin = async (
    loginDto: LoginDto,
    requestMetadata: RequestMetadata,
  ) => {
    return await lastValueFrom(
      this.rabbitMqAuthClient.send(
        { cmd: 'login' },
        {
          loginDto,
          requestMetadata,
        },
      ),
    );
  };

  public handleCreateCompany = async (
    userId: string,
    createCompanyDto: CreateCompanyDto,
  ) => {
    return await lastValueFrom(
      this.rabbitMqJobClient.send(
        { cmd: 'create-company' },
        { createCompanyDto, userId },
      ),
    );
  };

  public handleGetProfile = async (userId: string) => {
    return await lastValueFrom(
      this.rabbitMqUserClient.send({ cmd: 'get-profile' }, { userId }),
    );
  };

  public handleUpdatePassword = async (
    updatePasswordDto: UpdatePasswordDto,
    userId: string,
  ) => {
    return await lastValueFrom(
      this.rabbitMqAuthClient.send(
        { cmd: 'update-password' },
        { updatePasswordDto, userId },
      ),
    );
  };

  public handleForgetPassword = async (
    forgetPasswordDto: ForgetPasswordDto,
  ) => {
    const { email, type } = forgetPasswordDto;

    return await lastValueFrom(
      this.rabbitMqAuthClient.send(
        { cmd: 'forget-password' },
        {
          email,
          type,
        },
      ),
    );
  };

  public handleSignup = async (
    createUserDto: CreateUserDto,
    requestMetadata: RequestMetadata,
    files?: Array<Express.Multer.File>,
  ) => {
    return await lastValueFrom(
      this.rabbitMqUserClient.send(
        { cmd: 'create-user' },
        {
          createUserDto,
          requestMetadata,
          files,
        },
      ),
    );
  };

  public handleRefreshToken = async (email: string) => {
    return await lastValueFrom(
      this.rabbitMqAuthClient.send({ cmd: 'refresh-token' }, email),
    );
  };

  public handleVerifyEmail = async (email: string) => {
    return await lastValueFrom(
      this.rabbitMqAuthClient.send({ cmd: 'verify-email' }, email),
    );
  };

  public handleSignout = async (user: User) => {
    return await lastValueFrom(
      this.rabbitMqAuthClient.send({ cmd: 'sign-out' }, user),
    );
  };

  public handleCreateSocialAccount = async (
    createSocialAccount: CreateSocialAccount,
  ) => {
    return await lastValueFrom(
      this.rabbitMqAuthClient.send(
        { cmd: 'create-social-account' },
        createSocialAccount,
      ),
    );
  };

  public handleCheckExistedSocialAccount = async (
    provider: Provider,
    provider_id: string,
    email?: string,
  ) => {
    return await lastValueFrom<User | null>(
      this.rabbitMqAuthClient.send(
        { cmd: 'check-existed-social-account' },
        {
          provider,
          provider_id,
          email,
        },
      ),
    );
  };

  public handleVerifyNewDevice = async (
    verifyNewDeviceDto: VerifyNewDeviceDto,
    requestMetadata: RequestMetadata,
    user: User,
  ) => {
    return lastValueFrom(
      this.rabbitMqAuthClient.send(
        { cmd: 'verify-new-device' },
        {
          verifyNewDeviceDto,
          requestMetadata,
          user,
        },
      ),
    );
  };
}
