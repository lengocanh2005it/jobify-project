import KeyvRedis from '@keyv/redis';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import Keyv from 'keyv';
import { DEFAULT_CACHE_TTL } from 'libs/common/constants';

@Injectable()
export class RedisService {
  private readonly redis: Redis;
  private readonly keyv: Keyv;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>(
      'redis.url',
      'redis://localhost:6379',
    );

    this.redis = new Redis(redisUrl);

    const redisStore = new KeyvRedis(redisUrl, { namespace: '' });

    this.keyv = new Keyv({ store: redisStore });

    this.keyv.on('error', (err) =>
      console.error('Redis connection error:', err),
    );
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

  getKeyvStore(): Keyv {
    return this.keyv;
  }

  getRedisStore(): Redis {
    return this.redis;
  }
}
