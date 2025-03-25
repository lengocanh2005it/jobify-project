import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { DEFAULT_CACHE_TTL } from 'libs/common/constants';

@Injectable()
export class RedisService {
  private readonly redis: Redis;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>(
      'redis.url',
      'redis://localhost:6379',
    );

    this.redis = new Redis(redisUrl);
  }

  async setKey(key: string, value: string, ttl?: number) {
    await this.redis.set(key, value, 'EX', ttl ?? DEFAULT_CACHE_TTL);
  }

  async getKey(key: string) {
    return this.redis.get(key);
  }

  async deleteKey(key: string) {
    await this.redis.del(key);
  }

  async deleteKeysByPattern(pattern: string) {
    const keys = await this.redis.keys(pattern);

    if (keys.length > 0) await this.redis.del(...keys);
  }
}
