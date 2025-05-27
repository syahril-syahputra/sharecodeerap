/*
  Warnings:

  - You are about to drop the column `openAIParamsId` on the `DefaultPrompt` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `DefaultPrompt` DROP FOREIGN KEY `DefaultPrompt_openAIParamsId_fkey`;

-- AlterTable
ALTER TABLE `DefaultPrompt` DROP COLUMN `openAIParamsId`,
    ADD COLUMN `explainMoreParamsId` INTEGER NULL,
    ADD COLUMN `mainParamsId` INTEGER NULL,
    ADD COLUMN `spellMoreParamsId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `DefaultPrompt` ADD CONSTRAINT `DefaultPrompt_mainParamsId_fkey` FOREIGN KEY (`mainParamsId`) REFERENCES `OpenAIParams`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DefaultPrompt` ADD CONSTRAINT `DefaultPrompt_explainMoreParamsId_fkey` FOREIGN KEY (`explainMoreParamsId`) REFERENCES `OpenAIParams`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DefaultPrompt` ADD CONSTRAINT `DefaultPrompt_spellMoreParamsId_fkey` FOREIGN KEY (`spellMoreParamsId`) REFERENCES `OpenAIParams`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
