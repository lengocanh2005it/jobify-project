import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategoryColumnToJobTable1742307788462
  implements MigrationInterface
{
  name = 'AddCategoryColumnToJobTable1742307788462';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`job\` ADD \`category\` enum ('backend', 'frontend', 'fullstack', 'devops', 'qa', 'data', 'mobile', 'other') NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`job\` DROP COLUMN \`category\``);
  }
}
