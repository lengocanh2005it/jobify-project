import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCancellbyColumnOfInterviewTable1741137146365
  implements MigrationInterface
{
  name = 'AddCancellbyColumnOfInterviewTable1741137146365';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`interview\` ADD \`cancelled_by\` enum ('candidate', 'admin', 'recruiter') NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`interview\` DROP COLUMN \`cancelled_by\``,
    );
  }
}
