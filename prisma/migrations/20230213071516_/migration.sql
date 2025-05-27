/*
  Warnings:

  - You are about to drop the column `verificationToken` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `verificationTokenExpires` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `verified` on the `Account` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Account` DROP COLUMN `verificationToken`,
    DROP COLUMN `verificationTokenExpires`,
    DROP COLUMN `verified`;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `verificationToken` VARCHAR(191) NULL,
    ADD COLUMN `verificationTokenExpires` DATETIME(3) NULL,
    ADD COLUMN `verified` INTEGER NULL DEFAULT 0;
