import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateDatabase1741175312555 implements MigrationInterface {
  name = 'UpdateDatabase1741175312555';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`message\` DROP FOREIGN KEY \`FK_7c8f889f3f2f042fd50ba22de4b\``,
    );
    await queryRunner.query(
      `CREATE TABLE \`conversation\` (\`id\` varchar(36) NOT NULL, \`conversation_name\` text NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`user_conversation\` (\`conversation_id\` varchar(36) NOT NULL, \`user_ud\` varchar(36) NOT NULL, INDEX \`IDX_b312a0529c18723a53f7e90cd9\` (\`conversation_id\`), INDEX \`IDX_1593e96b9b47832b9f8d97142d\` (\`user_ud\`), PRIMARY KEY (\`conversation_id\`, \`user_ud\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` DROP COLUMN \`parent_id\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` ADD \`is_read\` tinyint NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` ADD \`read_at\` timestamp NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` ADD \`replied_message_id\` varchar(36) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` ADD \`conversation_id\` varchar(36) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` ADD CONSTRAINT \`FK_2b86cea16001e20b8e13342ec78\` FOREIGN KEY (\`replied_message_id\`) REFERENCES \`message\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` ADD CONSTRAINT \`FK_7fe3e887d78498d9c9813375ce2\` FOREIGN KEY (\`conversation_id\`) REFERENCES \`conversation\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_conversation\` ADD CONSTRAINT \`FK_b312a0529c18723a53f7e90cd9d\` FOREIGN KEY (\`conversation_id\`) REFERENCES \`conversation\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_conversation\` ADD CONSTRAINT \`FK_1593e96b9b47832b9f8d97142dd\` FOREIGN KEY (\`user_ud\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user_conversation\` DROP FOREIGN KEY \`FK_1593e96b9b47832b9f8d97142dd\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_conversation\` DROP FOREIGN KEY \`FK_b312a0529c18723a53f7e90cd9d\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` DROP FOREIGN KEY \`FK_7fe3e887d78498d9c9813375ce2\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` DROP FOREIGN KEY \`FK_2b86cea16001e20b8e13342ec78\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` DROP COLUMN \`conversation_id\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` DROP COLUMN \`replied_message_id\``,
    );
    await queryRunner.query(`ALTER TABLE \`message\` DROP COLUMN \`read_at\``);
    await queryRunner.query(`ALTER TABLE \`message\` DROP COLUMN \`is_read\``);
    await queryRunner.query(
      `ALTER TABLE \`message\` ADD \`parent_id\` varchar(36) NULL`,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_1593e96b9b47832b9f8d97142d\` ON \`user_conversation\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_b312a0529c18723a53f7e90cd9\` ON \`user_conversation\``,
    );
    await queryRunner.query(`DROP TABLE \`user_conversation\``);
    await queryRunner.query(`DROP TABLE \`conversation\``);
    await queryRunner.query(
      `ALTER TABLE \`message\` ADD CONSTRAINT \`FK_7c8f889f3f2f042fd50ba22de4b\` FOREIGN KEY (\`parent_id\`) REFERENCES \`message\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
