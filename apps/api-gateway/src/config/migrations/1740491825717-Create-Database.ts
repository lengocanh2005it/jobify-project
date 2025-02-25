import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDatabase1740491825717 implements MigrationInterface {
  name = 'CreateDatabase1740491825717';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`requirement\` (\`id\` varchar(36) NOT NULL, \`requirement\` text NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`job\` (\`id\` varchar(36) NOT NULL, \`title\` varchar(255) NOT NULL, \`address\` varchar(255) NOT NULL, \`job_type\` enum ('full_time', 'part_time', 'remote') NOT NULL, \`salary_min\` decimal(10,2) NOT NULL, \`salary_max\` decimal(10,2) NOT NULL, \`description\` text NOT NULL, \`status\` enum ('open', 'closed') NOT NULL, \`posted_at\` timestamp NOT NULL, \`expired_at\` timestamp NOT NULL, \`is_approved\` tinyint NOT NULL DEFAULT 0, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`recruiter_id\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`application\` (\`id\` varchar(36) NOT NULL, \`resume_link\` text NOT NULL, \`cover_letter_link\` text NULL, \`status\` enum ('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending', \`applied_at\` timestamp NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`candidate_id\` varchar(36) NULL, \`job_id\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`review\` (\`id\` varchar(36) NOT NULL, \`ratings_number\` int NOT NULL, \`comment\` text NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`candidate_id\` varchar(36) NULL, \`company_id\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`company\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`bio\` varchar(255) NULL, \`address\` varchar(255) NOT NULL, \`website\` varchar(255) NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`message\` (\`id\` varchar(36) NOT NULL, \`content\` text NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`sender_id\` varchar(36) NULL, \`receiver_id\` varchar(36) NULL, \`parent_id\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`notification\` (\`id\` varchar(36) NOT NULL, \`title\` varchar(255) NOT NULL, \`message\` text NOT NULL, \`is_read\` tinyint NOT NULL DEFAULT 0, \`type\` varchar(255) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`role\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`description\` varchar(255) NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`user\` (\`id\` varchar(36) NOT NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`phone_number\` varchar(255) NOT NULL, \`address\` varchar(255) NOT NULL, \`bio\` text NULL, \`full_name\` varchar(255) NOT NULL, \`avatar_url\` text NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`role_id\` varchar(36) NULL, \`company_id\` varchar(36) NULL, UNIQUE INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`user_notification\` (\`id\` varchar(36) NOT NULL, \`is_read\` tinyint NOT NULL DEFAULT 0, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`user_id\` varchar(36) NULL, \`notification_id\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`job_requirements\` (\`requirement_id\` varchar(36) NOT NULL, \`job_id\` varchar(36) NOT NULL, INDEX \`IDX_512bb73ab17c0c2ce4fa16e0be\` (\`requirement_id\`), INDEX \`IDX_21e15c93cde498d73e6b6227a1\` (\`job_id\`), PRIMARY KEY (\`requirement_id\`, \`job_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` DROP PRIMARY KEY`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` DROP COLUMN \`id\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` DROP COLUMN \`is_read\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` DROP COLUMN \`createdAt\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` DROP COLUMN \`updatedAt\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` ADD \`id\` varchar(36) NOT NULL PRIMARY KEY`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` ADD \`is_read\` tinyint NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` ADD \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` ADD \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` DROP PRIMARY KEY`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` ADD PRIMARY KEY (\`notification_id\`, \`user_id\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` DROP PRIMARY KEY`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` ADD PRIMARY KEY (\`notification_id\`, \`user_id\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` DROP PRIMARY KEY`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` ADD PRIMARY KEY (\`notification_id\`, \`user_id\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` DROP PRIMARY KEY`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` ADD PRIMARY KEY (\`notification_id\`, \`user_id\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` DROP PRIMARY KEY`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` ADD PRIMARY KEY (\`notification_id\`, \`user_id\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` DROP PRIMARY KEY`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` ADD PRIMARY KEY (\`notification_id\`, \`user_id\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` DROP PRIMARY KEY`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` ADD PRIMARY KEY (\`notification_id\`, \`user_id\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` DROP PRIMARY KEY`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` ADD PRIMARY KEY (\`notification_id\`, \`user_id\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` DROP PRIMARY KEY`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` ADD PRIMARY KEY (\`notification_id\`, \`user_id\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` DROP PRIMARY KEY`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` ADD PRIMARY KEY (\`notification_id\`, \`id\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` DROP PRIMARY KEY`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` ADD PRIMARY KEY (\`id\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` CHANGE \`notification_id\` \`notification_id\` varchar(36) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` DROP PRIMARY KEY`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` ADD PRIMARY KEY (\`id\`, \`notification_id\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` CHANGE \`user_id\` \`user_id\` varchar(36) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` DROP PRIMARY KEY`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` ADD PRIMARY KEY (\`notification_id\`, \`id\`, \`user_id\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` CHANGE \`notification_id\` \`notification_id\` varchar(36) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` CHANGE \`user_id\` \`user_id\` varchar(36) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` CHANGE \`notification_id\` \`notification_id\` varchar(36) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` CHANGE \`user_id\` \`user_id\` varchar(36) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` CHANGE \`notification_id\` \`notification_id\` varchar(36) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` CHANGE \`user_id\` \`user_id\` varchar(36) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` CHANGE \`notification_id\` \`notification_id\` varchar(36) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` CHANGE \`user_id\` \`user_id\` varchar(36) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` CHANGE \`notification_id\` \`notification_id\` varchar(36) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` CHANGE \`user_id\` \`user_id\` varchar(36) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` CHANGE \`notification_id\` \`notification_id\` varchar(36) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` CHANGE \`user_id\` \`user_id\` varchar(36) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` CHANGE \`notification_id\` \`notification_id\` varchar(36) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` CHANGE \`user_id\` \`user_id\` varchar(36) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` CHANGE \`notification_id\` \`notification_id\` varchar(36) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` CHANGE \`user_id\` \`user_id\` varchar(36) NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_db8be208a22e59619d1e38cc83\` ON \`user_notification\` (\`notification_id\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_ed67d2f825f4103de44ec3b6ba\` ON \`user_notification\` (\`user_id\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`job\` ADD CONSTRAINT \`FK_5db01afd48f540be458198f367b\` FOREIGN KEY (\`recruiter_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`application\` ADD CONSTRAINT \`FK_683077d7193912bff4b23d5d08d\` FOREIGN KEY (\`candidate_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`application\` ADD CONSTRAINT \`FK_c67a88c0ec9a378c447df6a87ba\` FOREIGN KEY (\`job_id\`) REFERENCES \`job\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`review\` ADD CONSTRAINT \`FK_30b84519d693e79b4d05129eb49\` FOREIGN KEY (\`candidate_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`review\` ADD CONSTRAINT \`FK_60bb5eb4d4259187272283ad106\` FOREIGN KEY (\`company_id\`) REFERENCES \`company\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` ADD CONSTRAINT \`FK_c0ab99d9dfc61172871277b52f6\` FOREIGN KEY (\`sender_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` ADD CONSTRAINT \`FK_f4da40532b0102d51beb220f16a\` FOREIGN KEY (\`receiver_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` ADD CONSTRAINT \`FK_7c8f889f3f2f042fd50ba22de4b\` FOREIGN KEY (\`parent_id\`) REFERENCES \`message\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD CONSTRAINT \`FK_fb2e442d14add3cefbdf33c4561\` FOREIGN KEY (\`role_id\`) REFERENCES \`role\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD CONSTRAINT \`FK_9e70b5f9d7095018e86970c7874\` FOREIGN KEY (\`company_id\`) REFERENCES \`company\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` ADD CONSTRAINT \`FK_ed67d2f825f4103de44ec3b6ba7\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` ADD CONSTRAINT \`FK_db8be208a22e59619d1e38cc831\` FOREIGN KEY (\`notification_id\`) REFERENCES \`notification\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
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
      `ALTER TABLE \`user_notification\` DROP FOREIGN KEY \`FK_db8be208a22e59619d1e38cc831\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` DROP FOREIGN KEY \`FK_ed67d2f825f4103de44ec3b6ba7\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` DROP FOREIGN KEY \`FK_9e70b5f9d7095018e86970c7874\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` DROP FOREIGN KEY \`FK_fb2e442d14add3cefbdf33c4561\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` DROP FOREIGN KEY \`FK_7c8f889f3f2f042fd50ba22de4b\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` DROP FOREIGN KEY \`FK_f4da40532b0102d51beb220f16a\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` DROP FOREIGN KEY \`FK_c0ab99d9dfc61172871277b52f6\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`review\` DROP FOREIGN KEY \`FK_60bb5eb4d4259187272283ad106\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`review\` DROP FOREIGN KEY \`FK_30b84519d693e79b4d05129eb49\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`application\` DROP FOREIGN KEY \`FK_c67a88c0ec9a378c447df6a87ba\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`application\` DROP FOREIGN KEY \`FK_683077d7193912bff4b23d5d08d\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`job\` DROP FOREIGN KEY \`FK_5db01afd48f540be458198f367b\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_ed67d2f825f4103de44ec3b6ba\` ON \`user_notification\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_db8be208a22e59619d1e38cc83\` ON \`user_notification\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` CHANGE \`user_id\` \`user_id\` varchar(36) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` CHANGE \`notification_id\` \`notification_id\` varchar(36) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` CHANGE \`user_id\` \`user_id\` varchar(36) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` CHANGE \`notification_id\` \`notification_id\` varchar(36) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` CHANGE \`user_id\` \`user_id\` varchar(36) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` CHANGE \`notification_id\` \`notification_id\` varchar(36) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` CHANGE \`user_id\` \`user_id\` varchar(36) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` CHANGE \`notification_id\` \`notification_id\` varchar(36) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` CHANGE \`user_id\` \`user_id\` varchar(36) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` CHANGE \`notification_id\` \`notification_id\` varchar(36) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` CHANGE \`user_id\` \`user_id\` varchar(36) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` CHANGE \`notification_id\` \`notification_id\` varchar(36) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` CHANGE \`user_id\` \`user_id\` varchar(36) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` CHANGE \`notification_id\` \`notification_id\` varchar(36) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` CHANGE \`user_id\` \`user_id\` varchar(36) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` CHANGE \`notification_id\` \`notification_id\` varchar(36) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` DROP PRIMARY KEY`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` ADD PRIMARY KEY (\`notification_id\`, \`id\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` CHANGE \`user_id\` \`user_id\` varchar(36) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` DROP PRIMARY KEY`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` ADD PRIMARY KEY (\`id\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` CHANGE \`notification_id\` \`notification_id\` varchar(36) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` DROP PRIMARY KEY`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` ADD PRIMARY KEY (\`notification_id\`, \`id\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` DROP PRIMARY KEY`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` ADD PRIMARY KEY (\`user_id\`, \`notification_id\`, \`id\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` DROP PRIMARY KEY`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` ADD PRIMARY KEY (\`user_id\`, \`notification_id\`, \`id\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` DROP PRIMARY KEY`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` ADD PRIMARY KEY (\`user_id\`, \`notification_id\`, \`id\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` DROP PRIMARY KEY`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` ADD PRIMARY KEY (\`user_id\`, \`notification_id\`, \`id\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` DROP PRIMARY KEY`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` ADD PRIMARY KEY (\`user_id\`, \`notification_id\`, \`id\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` DROP PRIMARY KEY`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` ADD PRIMARY KEY (\`user_id\`, \`notification_id\`, \`id\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` DROP PRIMARY KEY`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` ADD PRIMARY KEY (\`user_id\`, \`notification_id\`, \`id\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` DROP PRIMARY KEY`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` ADD PRIMARY KEY (\`user_id\`, \`notification_id\`, \`id\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` DROP PRIMARY KEY`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` ADD PRIMARY KEY (\`user_id\`, \`notification_id\`, \`id\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` DROP PRIMARY KEY`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` ADD PRIMARY KEY (\`id\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` DROP COLUMN \`updatedAt\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` DROP COLUMN \`createdAt\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` DROP COLUMN \`is_read\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` DROP COLUMN \`id\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` ADD \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` ADD \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` ADD \`is_read\` tinyint NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` ADD \`id\` varchar(36) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_notification\` ADD PRIMARY KEY (\`id\`)`,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_21e15c93cde498d73e6b6227a1\` ON \`job_requirements\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_512bb73ab17c0c2ce4fa16e0be\` ON \`job_requirements\``,
    );
    await queryRunner.query(`DROP TABLE \`job_requirements\``);
    await queryRunner.query(`DROP TABLE \`user_notification\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` ON \`user\``,
    );
    await queryRunner.query(`DROP TABLE \`user\``);
    await queryRunner.query(`DROP TABLE \`role\``);
    await queryRunner.query(`DROP TABLE \`notification\``);
    await queryRunner.query(`DROP TABLE \`message\``);
    await queryRunner.query(`DROP TABLE \`company\``);
    await queryRunner.query(`DROP TABLE \`review\``);
    await queryRunner.query(`DROP TABLE \`application\``);
    await queryRunner.query(`DROP TABLE \`job\``);
    await queryRunner.query(`DROP TABLE \`requirement\``);
  }
}
