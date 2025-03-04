import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateRelationShip1741092678276 implements MigrationInterface {
  name = 'UpdateRelationShip1741092678276';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_ec7878d4e11440718ff6b859dd\` ON \`user_notification\``,
    );
    await queryRunner.query(
      `DROP INDEX \`REL_ec7878d4e11440718ff6b859dd\` ON \`user_notification\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` ADD CONSTRAINT \`FK_ec7878d4e11440718ff6b859dda\` FOREIGN KEY (\`job_id\`) REFERENCES \`job\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` ADD CONSTRAINT \`FK_74a242b0a0da99eb23aea697e48\` FOREIGN KEY (\`application_id\`) REFERENCES \`application\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` DROP FOREIGN KEY \`FK_74a242b0a0da99eb23aea697e48\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` DROP FOREIGN KEY \`FK_ec7878d4e11440718ff6b859dda\``,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`REL_ec7878d4e11440718ff6b859dd\` ON \`user_notification\` (\`job_id\`)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`IDX_ec7878d4e11440718ff6b859dd\` ON \`user_notification\` (\`job_id\`)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`IDX_74a242b0a0da99eb23aea697e4\` ON \`user_notification\` (\`application_id\`)`,
    );
  }
}
