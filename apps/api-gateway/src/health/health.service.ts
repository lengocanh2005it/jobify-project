import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class HealthService {
  constructor(
    @Inject('HEALTH_SERVICE')
    private readonly rabbitMqHealthClient: ClientProxy,
  ) {}

  public handleCheckHealthy = async () => {
    return lastValueFrom(
      this.rabbitMqHealthClient.send({ cmd: 'health-check' }, {}),
    );
  };
}
