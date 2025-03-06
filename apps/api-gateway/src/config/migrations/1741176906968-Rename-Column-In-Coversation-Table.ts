import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameColumnInCoversationTable1741176906968
  implements MigrationInterface
{
  name = 'RenameColumnInCoversationTable1741176906968';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user_conversation\` DROP FOREIGN KEY \`FK_1593e96b9b47832b9f8d97142dd\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_1593e96b9b47832b9f8d97142d\` ON \`user_conversation\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_conversation\` CHANGE \`user_ud\` \`user_id\` varchar(36) NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_2b97367ea8ccd8e415681f8b0d\` ON \`user_conversation\` (\`user_id\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_conversation\` ADD CONSTRAINT \`FK_2b97367ea8ccd8e415681f8b0d7\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user_conversation\` DROP FOREIGN KEY \`FK_2b97367ea8ccd8e415681f8b0d7\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_2b97367ea8ccd8e415681f8b0d\` ON \`user_conversation\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_conversation\` CHANGE \`user_id\` \`user_ud\` varchar(36) NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_1593e96b9b47832b9f8d97142d\` ON \`user_conversation\` (\`user_ud\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_conversation\` ADD CONSTRAINT \`FK_1593e96b9b47832b9f8d97142dd\` FOREIGN KEY (\`user_ud\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
