import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNewColumnsToUsersTable1740974276823
  implements MigrationInterface
{
  name = 'AddNewColumnsToUsersTable1740974276823';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`job_posted_count\` int NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`application_applied_count\` int NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user\` DROP COLUMN \`application_applied_count\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` DROP COLUMN \`job_posted_count\``,
    );
  }
}
