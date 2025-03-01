import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddApprovalStatusOfInterviewTable1740798994177
  implements MigrationInterface
{
  name = 'AddApprovalStatusOfInterviewTable1740798994177';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`interview\` ADD \`approval_status\` enum ('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`interview\` DROP COLUMN \`approval_status\``,
    );
  }
}
