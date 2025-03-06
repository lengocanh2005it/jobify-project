import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUserNotificationTableAndConversationTable1741228863178
  implements MigrationInterface
{
  name = 'UpdateUserNotificationTableAndConversationTable1741228863178';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`message\` ADD \`type\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`conversation\` ADD \`deletedAt\` timestamp(6) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` ADD \`deletedAt\` timestamp(6) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` ADD \`attachment_url\` text NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` ADD \`conversation_id\` varchar(36) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` ADD CONSTRAINT \`FK_a6e1f4fa22e45e0277e8a3be25e\` FOREIGN KEY (\`conversation_id\`) REFERENCES \`conversation\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` DROP FOREIGN KEY \`FK_a6e1f4fa22e45e0277e8a3be25e\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` DROP COLUMN \`conversation_id\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` DROP COLUMN \`attachment_url\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` DROP COLUMN \`deletedAt\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`conversation\` DROP COLUMN \`deletedAt\``,
    );
    await queryRunner.query(`ALTER TABLE \`message\` DROP COLUMN \`type\``);
  }
}
