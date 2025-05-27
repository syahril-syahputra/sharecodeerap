/*
  Warnings:

  - You are about to drop the column `age` on the `DefaultPrompt` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `DefaultPrompt` DROP COLUMN `age`,
    ADD COLUMN `countryId` INTEGER NULL,
    ADD COLUMN `maxAge` INTEGER NOT NULL DEFAULT 10,
    ADD COLUMN `minAge` INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE `DefaultPrompt` ADD CONSTRAINT `DefaultPrompt_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
