import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAvatarUrlColumnUserTable1740386470762 implements MigrationInterface {
    name = 'AddAvatarUrlColumnUserTable1740386470762'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`full_name\``);
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`full_name\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`avatar_url\` text NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`avatar_url\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`full_name\``);
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`full_name\` varchar(255) NOT NULL`);
    }

}
