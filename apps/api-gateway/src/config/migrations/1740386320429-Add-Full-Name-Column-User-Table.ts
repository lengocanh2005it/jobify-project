import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFullNameColumnUserTable1740386320429
  implements MigrationInterface
{
  name = 'AddFullNameColumnUserTable1740386320429';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`full_name\` varchar(255) NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`full_name\``);
  }
}
