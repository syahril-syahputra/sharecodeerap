/*
  Warnings:

  - You are about to drop the column `mainParamsId` on the `DefaultPrompt` table. All the data in the column will be lost.
  - You are about to drop the `MainParams` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `openAIParamsId` to the `DefaultPrompt` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `DefaultPrompt` DROP FOREIGN KEY `DefaultPrompt_mainParamsId_fkey`;

-- DropForeignKey
ALTER TABLE `MainParams` DROP FOREIGN KEY `MainParams_createdById_fkey`;

-- AlterTable
ALTER TABLE `DefaultPrompt` DROP COLUMN `mainParamsId`,
    ADD COLUMN `openAIParamsId` INTEGER NOT NULL;

-- DropTable
DROP TABLE `MainParams`;

-- CreateTable
CREATE TABLE `OpenAIParams` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `name` VARCHAR(191) NOT NULL,
    `temperature` DOUBLE NOT NULL,
    `topP` DOUBLE NOT NULL,
    `frequencyPenalty` DOUBLE NOT NULL,
    `PresencePenalty` DOUBLE NOT NULL,
    `bestOf` INTEGER NOT NULL,
    `engine` VARCHAR(191) NOT NULL,
    `createdById` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DefaultPrompt` ADD CONSTRAINT `DefaultPrompt_openAIParamsId_fkey` FOREIGN KEY (`openAIParamsId`) REFERENCES `OpenAIParams`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OpenAIParams` ADD CONSTRAINT `OpenAIParams_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `AdminUser`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
