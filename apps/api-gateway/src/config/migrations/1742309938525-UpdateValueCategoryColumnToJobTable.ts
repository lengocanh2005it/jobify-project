import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateValueCategoryColumnToJobTable1742309938525
  implements MigrationInterface
{
  name = 'UpdateValueCategoryColumnToJobTable1742309938525';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`job\` DROP COLUMN \`category\``);
    await queryRunner.query(
      `ALTER TABLE \`job\` ADD \`category\` enum ('backend', 'frontend', 'fullstack', 'devops', 'qa', 'data', 'mobile', 'other', 'software_engineer', 'tester') NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`job\` DROP COLUMN \`category\``);
    await queryRunner.query(
      `ALTER TABLE \`job\` ADD \`category\` enum ('backend', 'frontend', 'fullstack', 'devops', 'qa', 'data', 'mobile', 'other') NOT NULL`,
    );
  }
}
