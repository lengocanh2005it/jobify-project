import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCancelReasonCancelledByColumnOfJobTable1741523994733
  implements MigrationInterface
{
  name = 'AddCancelReasonCancelledByColumnOfJobTable1741523994733';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`job\` ADD \`cancel_reason\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`job\` ADD \`cancelled_by\` varchar(255) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`job\` DROP COLUMN \`cancelled_by\``);
    await queryRunner.query(
      `ALTER TABLE \`job\` DROP COLUMN \`cancel_reason\``,
    );
  }
}
