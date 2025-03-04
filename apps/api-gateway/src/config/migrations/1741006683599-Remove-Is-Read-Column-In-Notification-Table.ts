import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveIsReadColumnInNotificationTable1741006683599
  implements MigrationInterface
{
  name = 'RemoveIsReadColumnInNotificationTable1741006683599';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`notification\` DROP COLUMN \`is_read\``,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`notification\` DROP COLUMN \`is_read\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`notification\` ADD \`is_read\` tinyint NOT NULL DEFAULT '0'`,
    );
  }
}
