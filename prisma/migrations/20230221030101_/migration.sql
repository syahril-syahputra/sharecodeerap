/*
  Warnings:

  - A unique constraint covering the columns `[canonicalEmail]` on the table `AdminUser` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `AdminUser` ADD COLUMN `canonicalEmail` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `AdminUser.canonicalEmail_unique` ON `AdminUser`(`canonicalEmail`);
