import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddResultAndScoreColumnToInterviewTable1740816778799
  implements MigrationInterface
{
  name = 'AddResultAndScoreColumnToInterviewTable1740816778799';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`interview\` ADD \`result\` enum ('passed', 'failed', 'pending') NOT NULL DEFAULT 'pending'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`interview\` ADD \`result_note\` text NULL`,
    );
    await queryRunner.query(`ALTER TABLE \`interview\` ADD \`score\` int NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`interview\` DROP COLUMN \`score\``);
    await queryRunner.query(
      `ALTER TABLE \`interview\` DROP COLUMN \`result_note\``,
    );
    await queryRunner.query(`ALTER TABLE \`interview\` DROP COLUMN \`result\``);
  }
}
