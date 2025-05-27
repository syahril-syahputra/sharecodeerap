/*
  Warnings:

  - You are about to drop the column `lastLogin` on the `Account` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Account` DROP COLUMN `lastLogin`;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `lastLogin` DATETIME(3) NULL;
