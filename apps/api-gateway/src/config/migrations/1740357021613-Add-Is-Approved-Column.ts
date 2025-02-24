import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsApprovedColumn1740357021613 implements MigrationInterface {
  name = 'AddIsApprovedColumn1740357021613';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`job\` ADD \`is_approved\` tinyint NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`job\` DROP COLUMN \`is_approved\``);
  }
}
