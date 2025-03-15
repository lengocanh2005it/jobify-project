import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis, RedisOptions } from 'ioredis';

@Injectable()
export class RedisService {
  private redis: Redis;

  constructor(private readonly configService: ConfigService) {
    const redisOptions: RedisOptions = {
      host: configService.get<string>('redis.host'),
      port: configService.get<number>('redis.port'),
    };

    this.redis = new Redis(redisOptions);
  }

  async setKey(key: string, value: string, ttl: number) {
    await this.redis.set(key, value, 'EX', ttl);
  }

  async getKey(key: string) {
    return this.redis.get(key);
  }

  async deleteKey(key: string) {
    await this.redis.del(key);
  }
}
