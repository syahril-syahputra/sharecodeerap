/*
  Warnings:

  - Added the required column `firstName` to the `AdminUser` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `AdminUser` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userName` to the `AdminUser` table without a default value. This is not possible if the table is not empty.
  - Added the required column `age` to the `DefaultPrompt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `language` to the `DefaultPrompt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mainParamsId` to the `DefaultPrompt` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `AdminUser` ADD COLUMN `firstName` VARCHAR(191) NOT NULL,
    ADD COLUMN `lastName` VARCHAR(191) NOT NULL,
    ADD COLUMN `userName` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `DefaultPrompt` ADD COLUMN `age` INTEGER NOT NULL,
    ADD COLUMN `language` VARCHAR(191) NOT NULL,
    ADD COLUMN `mainParamsId` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `MainParams` (
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
ALTER TABLE `DefaultPrompt` ADD CONSTRAINT `DefaultPrompt_mainParamsId_fkey` FOREIGN KEY (`mainParamsId`) REFERENCES `MainParams`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MainParams` ADD CONSTRAINT `MainParams_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `AdminUser`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
