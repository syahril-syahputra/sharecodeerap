-- AlterTable
ALTER TABLE `User` ADD COLUMN `userLevelId` INTEGER NULL;

-- CreateTable
CREATE TABLE `UserLevel` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tier` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `points` INTEGER NOT NULL,

    UNIQUE INDEX `UserLevel.tier`(`tier`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_userLevelId_fkey` FOREIGN KEY (`userLevelId`) REFERENCES `UserLevel`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
