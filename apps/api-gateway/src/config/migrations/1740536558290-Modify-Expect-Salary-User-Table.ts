import { MigrationInterface, QueryRunner } from "typeorm";

export class ModifyExpectSalaryUserTable1740536558290 implements MigrationInterface {
    name = 'ModifyExpectSalaryUserTable1740536558290'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` CHANGE \`expected_salary\` \`expected_salary\` decimal(10,2) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` CHANGE \`expected_salary\` \`expected_salary\` decimal(10,2) NOT NULL`);
    }

}
