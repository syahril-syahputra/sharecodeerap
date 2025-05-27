/*
  Warnings:

  - You are about to drop the column `PresencePenalty` on the `OpenAIParams` table. All the data in the column will be lost.
  - Added the required column `presencePenalty` to the `OpenAIParams` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `OpenAIParams` DROP COLUMN `PresencePenalty`,
    ADD COLUMN `presencePenalty` DOUBLE NOT NULL;
