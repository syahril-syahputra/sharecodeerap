/*
  Warnings:

  - A unique constraint covering the columns `[userName]` on the table `AdminUser` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `AdminUser.userName_unique` ON `AdminUser`(`userName`);
