import { CacheInterceptor } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Query,
  RawBodyRequest,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { PaymentsService } from 'apps/api-gateway/src/payments/payments.service';
import { User } from 'apps/users/src/entities';
import { Request } from 'express';
import { Role } from 'libs/common/constants';
import { ResponseMessage, Roles } from 'libs/common/decorators';
import { SearchTransactionsDto } from 'libs/common/dtos';
import { JwtAuthGuard, RoleAuthGuard } from 'libs/common/guards';
import { RBAcGuard, RBAcPermissions } from 'nestjs-rbac';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ResponseMessage('Checkout session created successfully.')
  @UseGuards(JwtAuthGuard, RoleAuthGuard, RBAcGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  @RBAcPermissions('payment@create')
  @ApiOperation({
    summary: 'Create checkout session',
    description:
      'Create checkout session for payment of premium package using Stripe.',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        checkout_session_url: 'https://stripe...',
      },
    },
  })
  async handleCreatePayment(@Req() request: Request) {
    const user = request.user as User;

    return this.paymentsService.handleCreatePayment(user);
  }

  @Post('stripe/webhooks')
  @ResponseMessage('Updated transaction from Stripe Webhook successfully.')
  @ApiOperation({
    summary: 'Stripe webhooks',
    description: 'Handling stripe webhooks',
  })
  @ApiResponse({
    status: 201,
    schema: {
      example: {
        received: true,
      },
    },
  })
  async handleStripeWebhook(@Req() req: RawBodyRequest<Request>) {
    const sig = req.headers['stripe-signature'] as string;

    if (!req.rawBody)
      throw new BadRequestException('Missing rawBody in request.');

    return this.paymentsService.handleStripeWebhooks(
      sig,
      Buffer.from(req.rawBody),
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @ResponseMessage('Get all payments successfully!')
  @Roles(Role.ADMIN)
  @RBAcPermissions('payment@read')
  @ApiBearerAuth()
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({
    summary: 'Get all payments',
    description: 'Get all payments of users.',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: [
        {
          id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
          amount: 1200,
          status: 'PENDING',
          payment_date: '2025-03-20T12:12:12Z',
          expiry_date: '2025-03-25T12:12:12Z',
          user: {
            id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
            full_name: 'John Doe',
            email: 'johndoe01@gmail.com',
            phone_number: '+124345345',
            is_premium: true,
            premium_expiry: '2025-03-30T12:12:12Z',
            address: 'Viet Nam',
          },
        },
        {
          id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
          amount: 1200,
          status: 'PENDING',
          payment_date: '2025-03-20T12:12:12Z',
          expiry_date: '2025-03-25T12:12:12Z',
          user: {
            id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
            full_name: 'Luke Coleman',
            email: 'johndoe01@gmail.com',
            phone_number: '+124345345',
            is_premium: true,
            premium_expiry: '2025-03-30T12:12:12Z',
            address: 'Viet Nam',
          },
        },
      ],
    },
  })
  async getPayments(@Query() searchTransactionsDto?: SearchTransactionsDto) {
    return this.paymentsService.handleGetPayments(searchTransactionsDto);
  }
}
