import { Controller, UseInterceptors } from '@nestjs/common';
import { RedisService } from './redis.service';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { ServicesExceptionInterceptor } from 'libs/common/interceptors';

@Controller()
@UseInterceptors(ServicesExceptionInterceptor)
export class RedisController {
  constructor(private readonly redisService: RedisService) {}

  @EventPattern('set-key')
  async setKey(
    @Payload('key') key: string,
    @Payload('data') data: string,
    @Payload('ttl') ttl: number,
  ) {
    return this.redisService.setKey(key, data, ttl);
  }

  @MessagePattern('get-key')
  async getKey(@Payload() key: string) {
    return this.redisService.getKey(key);
  }

  @EventPattern('del-key')
  async delKey(@Payload() key: string) {
    return this.redisService.deleteKey(key);
  }
}
