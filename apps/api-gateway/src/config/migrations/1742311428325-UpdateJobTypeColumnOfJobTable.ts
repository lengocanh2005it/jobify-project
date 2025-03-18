import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateJobTypeColumnOfJobTable1742311428325
  implements MigrationInterface
{
  name = 'UpdateJobTypeColumnOfJobTable1742311428325';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`job\` CHANGE \`job_type\` \`job_type\` enum ('full_time', 'part_time', 'remote', 'freelance') NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`job\` CHANGE \`job_type\` \`job_type\` enum ('full_time', 'part_time', 'remote') NOT NULL`,
    );
  }
}
