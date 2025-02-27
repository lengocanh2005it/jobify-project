import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdteUserTable1740580342362 implements MigrationInterface {
  name = 'UpdteUserTable1740580342362';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`transaction\` (\`id\` varchar(36) NOT NULL, \`amount\` decimal(10,2) NOT NULL, \`status\` enum ('PENDING', 'SUCCESS', 'FAILED') NOT NULL DEFAULT 'PENDING', \`payment_date\` timestamp NOT NULL, \`expiry_date\` timestamp NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`user_id\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`is_premium\` tinyint NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`premium_expiry\` timestamp NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`transaction\` ADD CONSTRAINT \`FK_b4a3d92d5dde30f3ab5c34c5862\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`transaction\` DROP FOREIGN KEY \`FK_b4a3d92d5dde30f3ab5c34c5862\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` DROP COLUMN \`premium_expiry\``,
    );
    await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`is_premium\``);
    await queryRunner.query(`DROP TABLE \`transaction\``);
  }
}
