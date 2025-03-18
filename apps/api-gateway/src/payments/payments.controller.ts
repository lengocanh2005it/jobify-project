import { CacheInterceptor } from '@nestjs/cache-manager';
import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PaymentsService } from 'apps/api-gateway/src/payments/payments.service';
import { User } from 'apps/users/src/entities';
import { Request } from 'express';
import { Role } from 'libs/common/constants';
import { ResponseMessage, Roles } from 'libs/common/decorators';
import { SearchTransactionsDto } from 'libs/common/dtos';
import { JwtAuthGuard, RoleAuthGuard } from 'libs/common/guards';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ResponseMessage('Checkout session created successfully.')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  async handleCreatePayment(@Req() request: Request) {
    const user = request.user as User;

    return this.paymentsService.handleCreatePayment(user);
  }

  @Post('stripe/webhooks')
  @ResponseMessage('Updated transaction from Stripe Webhook successfully.')
  async handleStripeWebhook(@Req() req: Request) {
    const sig = req.headers['stripe-signature'] as string;

    return this.paymentsService.handleStripeWebhooks(sig, req.body as string);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @ResponseMessage('Get all payments successfully!')
  @Roles(Role.ADMIN)
  @UseInterceptors(CacheInterceptor)
  async getPayments(@Query() searchTransactionsDto?: SearchTransactionsDto) {
    return this.paymentsService.handleGetPayments(searchTransactionsDto);
  }
}
