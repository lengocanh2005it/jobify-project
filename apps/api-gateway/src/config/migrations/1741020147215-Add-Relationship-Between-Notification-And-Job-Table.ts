import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRelationshipBetweenNotificationAndJobTable1741020147215
  implements MigrationInterface
{
  name = 'AddRelationshipBetweenNotificationAndJobTable1741020147215';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`job\` ADD \`notification_id\` varchar(36) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`job\` ADD CONSTRAINT \`FK_e052d744dd40d72e5733ac7df54\` FOREIGN KEY (\`notification_id\`) REFERENCES \`notification\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`job\` DROP FOREIGN KEY \`FK_e052d744dd40d72e5733ac7df54\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`job\` DROP COLUMN \`notification_id\``,
    );
  }
}
