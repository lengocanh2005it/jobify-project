import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryRunner } from 'typeorm';

@Injectable()
export class TransactionsProvider {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async executeTransaction<T>(
    operation: (queryRunner: QueryRunner) => Promise<T>,
    maxRetries = 3,
  ): Promise<T> {
    let attempt = 0;

    while (attempt < maxRetries) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const result = await operation(queryRunner);
        await queryRunner.commitTransaction();
        return result;
      } catch (error) {
        await queryRunner.rollbackTransaction();

        if (this.isRetryableError(error) && attempt < maxRetries - 1) {
          attempt++;
          console.warn(`Transaction failed (attempt ${attempt}). Retrying...`);
        } else {
          throw error;
        }
      } finally {
        await queryRunner.release();
      }
    }

    throw new Error('Transaction failed after maximum retries.');
  }

  private isRetryableError(error: unknown): boolean {
    const retryableErrors = ['ER_LOCK_DEADLOCK', 'ER_LOCK_WAIT_TIMEOUT'];

    return retryableErrors.includes((error as { code?: string }).code || '');
  }
}
