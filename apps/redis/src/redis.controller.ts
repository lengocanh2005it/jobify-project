import { Controller } from '@nestjs/common';
import { RedisService } from './redis.service';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class RedisController {
  constructor(private readonly redisService: RedisService) {}

  @EventPattern('set-key')
  async setKey(
    @Payload('key') key: string,
    @Payload('data') data: string,
    @Payload('ttl') ttl: number,
  ) {
    await this.redisService.setKey(key, data, ttl);
  }

  @MessagePattern('get-key')
  async getKey(@Payload() key: string) {
    return await this.redisService.getKey(key);
  }

  @EventPattern('del-key')
  async delKey(@Payload() key: string) {
    await this.redisService.deleteKey(key);
  }
}
