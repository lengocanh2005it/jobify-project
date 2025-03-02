import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddResumeLinkToTableUser1740906336136
  implements MigrationInterface
{
  name = 'AddResumeLinkToTableUser1740906336136';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`resume_link\` text NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`resume_link\``);
  }
}
