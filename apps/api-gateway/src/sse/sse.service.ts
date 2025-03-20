import { Injectable } from '@nestjs/common';
import { Observable, ReplaySubject } from 'rxjs';

@Injectable()
export class SseService {
  private readonly jobUpdates = new ReplaySubject<any[]>(1);

  public handleSendJobUpdates = (jobs: any[]) => {
    this.jobUpdates.next(jobs);
  };

  public handleGetJobUpdates = (): Observable<any> => {
    return this.jobUpdates.asObservable();
  };
}
