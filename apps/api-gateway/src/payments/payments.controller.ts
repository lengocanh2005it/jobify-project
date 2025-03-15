import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreatePaymentDto } from 'apps/api-gateway/src/payments/create-payment.dto';
import { PaymentsService } from 'apps/api-gateway/src/payments/payments.service';
import { User } from 'apps/users/src/entities';
import { createHmac } from 'crypto';
import dateFormat from 'dateformat';
import { Request } from 'express';
import { Role } from 'libs/common/constants';
import { ResponseMessage, Roles } from 'libs/common/decorators';
import { JwtAuthGuard, RoleAuthGuard } from 'libs/common/guards';
import qs from 'qs';
import dayjs from 'dayjs';
import * as crypto from 'crypto';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly configService: ConfigService,
  ) {}

  @Post('vnpay/premium')
  createPremiumPayment(@Body() payment: CreatePaymentDto) {
    try {
      const ipAddr = '127.0.0.1';
      const tmnCode = this.configService.get<string>('VNP_TMN_CODE');
      const secretKey = this.configService.get<string>('VNP_HASH_SECRET');
      let vnpUrl = this.configService.get<string>('VNP_URL');
      const returnUrl = this.configService.get<string>('VNP_RETURN_URL');

      console.log(tmnCode);
      console.log(secretKey);
      console.log(vnpUrl);
      console.log(returnUrl);

      const createDate = dayjs().format('YYYYMMDDHHmmss');
      const orderId = dayjs().format('DDHHmmss');
      const amount = payment?.amount ? payment.amount * 100 : 0; // Nhân 100 theo yêu cầu VNPay

      const orderInfo = payment?.orderInfo || 'Thanh toán dịch vụ Premium'; // Không dùng JSON.stringify()
      const orderType = 'billpayment';
      const locale = 'vn';
      const currCode = 'VND';

      let vnp_Params: any = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: tmnCode,
        vnp_Locale: locale,
        vnp_CurrCode: currCode,
        vnp_TxnRef: orderId,
        vnp_OrderInfo: orderInfo,
        vnp_OrderType: orderType,
        vnp_Amount: amount,
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: ipAddr,
        vnp_CreateDate: createDate,
      };

      // Sắp xếp object theo key trước khi ký
      vnp_Params = this.sortObject(vnp_Params);

      // Tạo chuỗi để ký
      const signData = qs.stringify(vnp_Params, { encode: false });
      const hmac = crypto.createHmac('sha512', secretKey ?? '');
      const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

      // Thêm chữ ký vào params
      vnp_Params['vnp_SecureHash'] = signed;
      vnpUrl += '?' + qs.stringify(vnp_Params, { encode: false });

      return {
        url: vnpUrl,
        vnp_TxnRef: orderId,
      };
    } catch (error) {
      console.error(error);
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private getVnpayTime(minutesToAdd: number): string {
    const now = new Date();
    now.setHours(now.getHours() + 7); // GMT+7
    if (minutesToAdd) {
      now.setMinutes(now.getMinutes() + minutesToAdd);
    }
    return now
      .toISOString()
      .replace(/[-T:.Z]/g, '')
      .slice(0, 14);
  }

  private createHmacSHA512(
    params: Record<string, string | number>, // Chấp nhận cả string và number
    secret: string,
  ): string {
    // Sắp xếp tham số theo thứ tự bảng chữ cái
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}=${encodeURIComponent(params[key].toString())}`) // Encode dữ liệu để tránh lỗi định dạng
      .join('&'); // Kết hợp thành chuỗi đúng định dạng VNPay

    // Tạo chữ ký HMAC SHA512
    return createHmac('sha512', secret)
      .update(Buffer.from(sortedParams, 'utf-8')) // Chuyển đổi chuỗi thành Buffer UTF-8
      .digest('hex'); // Trả về giá trị mã hóa dưới dạng hex
  }

  @Post()
  @ResponseMessage('Checkout session created successfully.')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  async handleCreatePayment(@Req() request: Request) {
    const user = request.user as User;

    return this.paymentsService.handleCreatePayment(user);
  }

  @Post('stripe/webhooks')
  async handleStripeWebhook(@Req() req: Request) {
    const sig = req.headers['stripe-signature'] as string;

    return this.paymentsService.handleStripeWebhooks(sig, req.body as string);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @ResponseMessage('Get all payments successfully!')
  @Roles(Role.ADMIN)
  async getPayments() {
    return this.paymentsService.handleGetPayments();
  }

  sortObject(obj: any) {
    const sorted: any = {};
    const keys = Object.keys(obj).sort(); // Sắp xếp key theo thứ tự bảng chữ cái

    for (const key of keys) {
      sorted[key] = obj[key]; // Giữ nguyên giá trị, không encode
    }
    return sorted;
  }
}
