import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRelationshipBetweenInterviewAndUserNotificationTable1741142845763
  implements MigrationInterface
{
  name = 'AddRelationshipBetweenInterviewAndUserNotificationTable1741142845763';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` ADD \`interview_id\` varchar(36) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` ADD CONSTRAINT \`FK_65e8bcc16bab48207cbc667777f\` FOREIGN KEY (\`interview_id\`) REFERENCES \`interview\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` DROP FOREIGN KEY \`FK_65e8bcc16bab48207cbc667777f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` DROP COLUMN \`interview_id\``,
    );
  }
}
