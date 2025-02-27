import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUserTable1740640690113 implements MigrationInterface {
  name = 'UpdateUserTable1740640690113';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`saved_job\` (\`id\` varchar(36) NOT NULL, \`savedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`user_id\` varchar(36) NULL, \`job_id\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`certifications\` json NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`saved_job\` ADD CONSTRAINT \`FK_dc2c64f40719148d79921d424ba\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`saved_job\` ADD CONSTRAINT \`FK_d7e38cdc6dc7765b30447cd06d4\` FOREIGN KEY (\`job_id\`) REFERENCES \`job\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`saved_job\` DROP FOREIGN KEY \`FK_d7e38cdc6dc7765b30447cd06d4\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`saved_job\` DROP FOREIGN KEY \`FK_dc2c64f40719148d79921d424ba\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` DROP COLUMN \`certifications\``,
    );
    await queryRunner.query(`DROP TABLE \`saved_job\``);
  }
}
