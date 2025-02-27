import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { PaymentsService } from 'apps/api-gateway/src/payments/payments.service';
import { Request } from 'express';
import { Role } from 'libs/common/constants';
import { Roles } from 'libs/common/decorators';
import { JwtAuthGuard, RoleAuthGuard } from 'libs/common/guards';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  handleCreatePayment(@Req() request: Request) {
    const userId = request.user?.id as string;

    return this.paymentsService.handleCreatePayment(userId);
  }

  @Post('stripe/webhooks')
  handleStripeWebhook(@Req() req: Request) {
    const sig = req.headers['stripe-signature'] as string;

    return this.paymentsService.handleStripeWebhooks(sig, req.body as string);
  }
}
