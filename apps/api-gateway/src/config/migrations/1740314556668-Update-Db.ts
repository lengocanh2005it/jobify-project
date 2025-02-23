import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateDb1740314556668 implements MigrationInterface {
  name = 'UpdateDb1740314556668';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`requirement\` (\`id\` varchar(36) NOT NULL, \`requirement\` text NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`job_requirements\` (\`requirement_id\` varchar(36) NOT NULL, \`job_id\` varchar(36) NOT NULL, INDEX \`IDX_512bb73ab17c0c2ce4fa16e0be\` (\`requirement_id\`), INDEX \`IDX_21e15c93cde498d73e6b6227a1\` (\`job_id\`), PRIMARY KEY (\`requirement_id\`, \`job_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(`ALTER TABLE \`job\` DROP COLUMN \`requirements\``);
    await queryRunner.query(
      `ALTER TABLE \`job_requirements\` ADD CONSTRAINT \`FK_512bb73ab17c0c2ce4fa16e0be7\` FOREIGN KEY (\`requirement_id\`) REFERENCES \`requirement\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`job_requirements\` ADD CONSTRAINT \`FK_21e15c93cde498d73e6b6227a19\` FOREIGN KEY (\`job_id\`) REFERENCES \`job\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`job_requirements\` DROP FOREIGN KEY \`FK_21e15c93cde498d73e6b6227a19\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`job_requirements\` DROP FOREIGN KEY \`FK_512bb73ab17c0c2ce4fa16e0be7\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`job\` ADD \`requirements\` json NOT NULL`,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_21e15c93cde498d73e6b6227a1\` ON \`job_requirements\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_512bb73ab17c0c2ce4fa16e0be\` ON \`job_requirements\``,
    );
    await queryRunner.query(`DROP TABLE \`job_requirements\``);
    await queryRunner.query(`DROP TABLE \`requirement\``);
  }
}
