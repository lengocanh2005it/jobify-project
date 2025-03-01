import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInterviewsTableAndItRelationship1740796914125
  implements MigrationInterface
{
  name = 'AddInterviewsTableAndItRelationship1740796914125';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`interview\` (\`id\` varchar(36) NOT NULL, \`title\` varchar(255) NOT NULL, \`description\` varchar(255) NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`candidate_id\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`interview\` ADD \`interview_type\` enum ('online', 'offline') NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`interview\` ADD \`interview_link\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`interview\` ADD \`interview_address\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`interview\` ADD \`cancel_reason\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`interview\` ADD \`interview_date\` timestamp NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`interview\` ADD \`status\` enum ('scheduled', 'finished', 'cancel') NOT NULL DEFAULT 'scheduled'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`interview\` ADD \`note\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`interview\` ADD \`recruiter_id\` varchar(36) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`interview\` ADD \`job_id\` varchar(36) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`interview\` ADD CONSTRAINT \`FK_3aec56b0feb4008c1e63abd3c3b\` FOREIGN KEY (\`candidate_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`interview\` ADD CONSTRAINT \`FK_fb47a6d95d40f023aa31ee12af5\` FOREIGN KEY (\`recruiter_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`interview\` ADD CONSTRAINT \`FK_7e40d34000df74377fb31d4bf11\` FOREIGN KEY (\`job_id\`) REFERENCES \`job\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`interview\` DROP FOREIGN KEY \`FK_7e40d34000df74377fb31d4bf11\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`interview\` DROP FOREIGN KEY \`FK_fb47a6d95d40f023aa31ee12af5\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`interview\` DROP FOREIGN KEY \`FK_3aec56b0feb4008c1e63abd3c3b\``,
    );
    await queryRunner.query(`ALTER TABLE \`interview\` DROP COLUMN \`job_id\``);
    await queryRunner.query(
      `ALTER TABLE \`interview\` DROP COLUMN \`recruiter_id\``,
    );
    await queryRunner.query(`ALTER TABLE \`interview\` DROP COLUMN \`note\``);
    await queryRunner.query(`ALTER TABLE \`interview\` DROP COLUMN \`status\``);
    await queryRunner.query(
      `ALTER TABLE \`interview\` DROP COLUMN \`interview_date\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`interview\` DROP COLUMN \`cancel_reason\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`interview\` DROP COLUMN \`interview_address\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`interview\` DROP COLUMN \`interview_link\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`interview\` DROP COLUMN \`interview_type\``,
    );
    await queryRunner.query(`DROP TABLE \`interview\``);
  }
}
