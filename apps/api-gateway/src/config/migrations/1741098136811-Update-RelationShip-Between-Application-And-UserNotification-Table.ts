import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateRelationShipBetweenApplicationAndUserNotificationTable1741098136811
  implements MigrationInterface
{
  name =
    'UpdateRelationShipBetweenApplicationAndUserNotificationTable1741098136811';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` ADD CONSTRAINT \`FK_74a242b0a0da99eb23aea697e48\` FOREIGN KEY (\`application_id\`) REFERENCES \`application\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` DROP FOREIGN KEY \`FK_74a242b0a0da99eb23aea697e48\``,
    );
  }
}
