import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateContentColumnOfMessageTable1741246215360
  implements MigrationInterface
{
  name = 'UpdateContentColumnOfMessageTable1741246215360';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`message\` CHANGE \`content\` \`content\` text NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` CHANGE \`content\` \`content\` text NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` CHANGE \`content\` \`content\` text NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` CHANGE \`content\` \`content\` text NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` CHANGE \`content\` \`content\` text NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` CHANGE \`content\` \`content\` text NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` CHANGE \`content\` \`content\` text NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` CHANGE \`content\` \`content\` text NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` CHANGE \`content\` \`content\` text NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` CHANGE \`content\` \`content\` text NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` CHANGE \`content\` \`content\` text NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` CHANGE \`content\` \`content\` text NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` CHANGE \`content\` \`content\` text NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`message\` CHANGE \`content\` \`content\` text NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` CHANGE \`content\` \`content\` text NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` CHANGE \`content\` \`content\` text NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` CHANGE \`content\` \`content\` text NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` CHANGE \`content\` \`content\` text NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` CHANGE \`content\` \`content\` text NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` CHANGE \`content\` \`content\` text NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` CHANGE \`content\` \`content\` text NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` CHANGE \`content\` \`content\` text NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` CHANGE \`content\` \`content\` text NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` CHANGE \`content\` \`content\` text NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` CHANGE \`content\` \`content\` text NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` CHANGE \`content\` \`content\` text NOT NULL`,
    );
  }
}
