/*
  Warnings:

  - You are about to drop the column `userName` on the `AdminUser` table. All the data in the column will be lost.
  - You are about to drop the column `language` on the `DefaultPrompt` table. All the data in the column will be lost.
  - You are about to drop the column `prompt` on the `DefaultPrompt` table. All the data in the column will be lost.
  - You are about to drop the column `totalTokens` on the `DefaultPrompt` table. All the data in the column will be lost.
  - You are about to drop the column `engine` on the `OpenAIParams` table. All the data in the column will be lost.
  - You are about to alter the column `type` on the `Prompt` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(0))`.
  - You are about to drop the column `verificationToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `verificationTokenExpires` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[canonicalEmail]` on the table `Account` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[inviteToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `maxTokens` to the `OpenAIParams` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Prompt` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `AdminUser.userName_unique` ON `AdminUser`;

-- AlterTable
ALTER TABLE `Account` ADD COLUMN `cancel_at` DATETIME(3) NULL,
    ADD COLUMN `cancel_at_period_end` BOOLEAN NULL,
    ADD COLUMN `canceled_at` DATETIME(3) NULL,
    ADD COLUMN `canonicalEmail` VARCHAR(191) NULL,
    ADD COLUMN `currency` VARCHAR(191) NULL,
    ADD COLUMN `customerId` VARCHAR(191) NULL,
    ADD COLUMN `email` VARCHAR(191) NULL,
    ADD COLUMN `name` VARCHAR(191) NULL,
    ADD COLUMN `productId` INTEGER NULL,
    ADD COLUMN `subscriptionCreatedAt` DATETIME(3) NULL,
    ADD COLUMN `subscriptionCurrentPeriodEnd` DATETIME(3) NULL,
    ADD COLUMN `subscriptionCurrentPeriodStart` DATETIME(3) NULL,
    ADD COLUMN `subscriptionDefaultPaymentMethod` VARCHAR(191) NULL,
    ADD COLUMN `subscriptionId` VARCHAR(191) NULL,
    ADD COLUMN `subscriptionStatus` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `AdminUser` DROP COLUMN `userName`;

-- AlterTable
ALTER TABLE `DefaultPrompt` DROP COLUMN `language`,
    DROP COLUMN `prompt`,
    DROP COLUMN `totalTokens`,
    ADD COLUMN `factParamsId` INTEGER NULL,
    ADD COLUMN `funFactsParamsId` INTEGER NULL,
    ADD COLUMN `languageId` INTEGER NULL,
    ADD COLUMN `metadataParamsId` INTEGER NULL,
    ADD COLUMN `quizParamsId` INTEGER NULL,
    ADD COLUMN `storyParamsId` INTEGER NULL;

-- AlterTable
ALTER TABLE `OpenAIParams` DROP COLUMN `engine`,
    ADD COLUMN `assistantPrompt` TEXT NULL,
    ADD COLUMN `engineId` INTEGER NULL,
    ADD COLUMN `maxTokens` INTEGER NOT NULL,
    ADD COLUMN `prompt` TEXT NULL,
    ADD COLUMN `systemPrompt` TEXT NULL,
    ADD COLUMN `userPrompt` TEXT NULL;

-- AlterTable
ALTER TABLE `Prompt` ADD COLUMN `defaultPromptId` INTEGER NULL,
    ADD COLUMN `deleted` BOOLEAN NULL,
    ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `fullRequest` LONGTEXT NULL,
    ADD COLUMN `funFactsScore` INTEGER NULL,
    ADD COLUMN `isCorrect` BOOLEAN NULL DEFAULT true,
    ADD COLUMN `learnMoreScore` INTEGER NULL,
    ADD COLUMN `metadataToken` VARCHAR(191) NULL,
    ADD COLUMN `promptParentId` INTEGER NULL,
    ADD COLUMN `reported` BOOLEAN NULL,
    ADD COLUMN `reportedAt` DATETIME(3) NULL,
    ADD COLUMN `topicId` INTEGER NULL,
    ADD COLUMN `userId` INTEGER NOT NULL,
    MODIFY `request` LONGTEXT NOT NULL,
    MODIFY `response` LONGTEXT NULL,
    MODIFY `sessionId` INTEGER NULL,
    MODIFY `type` ENUM('DEFAULT', 'DEFAULT_METADATA', 'EXPLAIN_MORE', 'FUN_FACTS', 'QUIZ', 'STORY', 'FACT') NULL DEFAULT 'DEFAULT';

-- AlterTable
ALTER TABLE `Session` ADD COLUMN `DefaultPromptId` INTEGER NULL,
    ADD COLUMN `processedPrompt` JSON NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `User` DROP COLUMN `verificationToken`,
    DROP COLUMN `verificationTokenExpires`,
    ADD COLUMN `country` VARCHAR(191) NULL,
    ADD COLUMN `device` VARCHAR(191) NULL,
    ADD COLUMN `inviteToken` VARCHAR(191) NULL,
    ADD COLUMN `inviteTokenExpires` DATETIME(3) NULL,
    ADD COLUMN `lastInteraction` DATETIME(3) NULL,
    ADD COLUMN `loginPin` INTEGER NULL,
    ADD COLUMN `loginToken` VARCHAR(191) NULL,
    ADD COLUMN `loginTokenExpires` DATETIME(3) NULL,
    ADD COLUMN `points` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `questionAsked` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `voiceCode` VARCHAR(191) NULL,
    ADD COLUMN `voiceName` VARCHAR(191) NULL,
    ADD COLUMN `weeklyRecap` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `FunFact` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `promptId` INTEGER NOT NULL,
    `fact` LONGTEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Product` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `stripeId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `default_price` VARCHAR(191) NOT NULL,
    `tokens` INTEGER NOT NULL,
    `default` BOOLEAN NULL,
    `active` BOOLEAN NOT NULL,
    `created` DATETIME(3) NOT NULL,
    `updated` DATETIME(3) NOT NULL,
    `description` TEXT NOT NULL,
    `livemode` BOOLEAN NOT NULL,
    `tax_code` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NULL,

    UNIQUE INDEX `Product.stripe_unique`(`stripeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Price` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `stripeId` VARCHAR(191) NOT NULL,
    `productStripeId` VARCHAR(191) NOT NULL,
    `currency` VARCHAR(191) NULL,
    `unit_amount` INTEGER NULL,
    `productId` INTEGER NULL,

    UNIQUE INDEX `Price.stripe_unique`(`stripeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Activity` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `imageId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Topic` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `imageId` VARCHAR(191) NOT NULL,
    `activityId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StoryTopic` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `promptId` INTEGER NOT NULL,
    `topicId` INTEGER NOT NULL,

    UNIQUE INDEX `StoryTopic_promptId_topicId_key`(`promptId`, `topicId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Quiz` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `topicId` INTEGER NOT NULL,
    `promptId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `finished` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuizEntry` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `repliedAt` DATETIME(3) NULL,
    `isCorrect` BOOLEAN NULL,
    `quizId` INTEGER NOT NULL,
    `question` VARCHAR(191) NOT NULL,
    `correctAnswer` BOOLEAN NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `message` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `type` ENUM('REGISTER', 'LOGIN', 'LOGOUT', 'CONFIRM_EMAIL', 'CONFIRM_RESEND', 'GPT', 'GPT_EXPLAIN_MORE', 'GPT_FUN_FACT', 'GPT_FACT', 'TTS', 'GET_ACCOUNT', 'GET_ACCOUNT_USAGE', 'GET_ACTIVITIES', 'GET_ALL_TOPICS', 'GET_LEVELS', 'GET_LANGUAGES', 'GET_PRODUCTS', 'GET_PROFILE', 'GET_FAQS', 'GET_PROMPTS', 'GET_PROMPTS_BY_QUERY', 'GET_SOCIALS', 'GET_TOPICS_BY_ACTIVITY', 'GET_USERS', 'GET_QUIZZES', 'GET_ONE_QUIZZES', 'CREATE_SUBSCRIPTION', 'CREATE_PORTAL_SESSION', 'CREATE_USER', 'EDIT_USER', 'SET_USER_ADMIN', 'DELETE_PROMPT', 'DELETE_USER', 'INVITE_USER', 'INVITE_USER_CONFIRM', 'ANSWER_QUIZ', 'REPORT_PROMPT', 'GPT_METADATA') NULL,
    `userId` INTEGER NULL,
    `promptId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Waitlist` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NULL,
    `status` ENUM('NOT_INVITED', 'INVITED', 'REDEEMED') NULL,
    `inviteToken` VARCHAR(191) NULL,
    `inviteTokenExpires` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `invitedAt` DATETIME(3) NULL,
    `invitedById` INTEGER NULL,
    `redeemedAt` DATETIME(3) NULL,

    UNIQUE INDEX `waitlist.inviteToken_unique`(`inviteToken`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ErrorLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `message` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `responseTime` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `type` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Faq` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `question` VARCHAR(191) NULL,
    `answer` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `languageId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Account.canonicalEmail_unique` ON `Account`(`canonicalEmail`);

-- CreateIndex
CREATE UNIQUE INDEX `User.inviteToken_unique` ON `User`(`inviteToken`);

-- AddForeignKey
ALTER TABLE `Account` ADD CONSTRAINT `Account_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_DefaultPromptId_fkey` FOREIGN KEY (`DefaultPromptId`) REFERENCES `DefaultPrompt`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prompt` ADD CONSTRAINT `Prompt_promptParentId_fkey` FOREIGN KEY (`promptParentId`) REFERENCES `Prompt`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prompt` ADD CONSTRAINT `Prompt_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prompt` ADD CONSTRAINT `Prompt_defaultPromptId_fkey` FOREIGN KEY (`defaultPromptId`) REFERENCES `DefaultPrompt`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prompt` ADD CONSTRAINT `Prompt_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `Topic`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FunFact` ADD CONSTRAINT `FunFact_promptId_fkey` FOREIGN KEY (`promptId`) REFERENCES `Prompt`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DefaultPrompt` ADD CONSTRAINT `DefaultPrompt_languageId_fkey` FOREIGN KEY (`languageId`) REFERENCES `Language`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DefaultPrompt` ADD CONSTRAINT `DefaultPrompt_funFactsParamsId_fkey` FOREIGN KEY (`funFactsParamsId`) REFERENCES `OpenAIParams`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DefaultPrompt` ADD CONSTRAINT `DefaultPrompt_metadataParamsId_fkey` FOREIGN KEY (`metadataParamsId`) REFERENCES `OpenAIParams`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DefaultPrompt` ADD CONSTRAINT `DefaultPrompt_storyParamsId_fkey` FOREIGN KEY (`storyParamsId`) REFERENCES `OpenAIParams`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DefaultPrompt` ADD CONSTRAINT `DefaultPrompt_quizParamsId_fkey` FOREIGN KEY (`quizParamsId`) REFERENCES `OpenAIParams`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DefaultPrompt` ADD CONSTRAINT `DefaultPrompt_factParamsId_fkey` FOREIGN KEY (`factParamsId`) REFERENCES `OpenAIParams`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OpenAIParams` ADD CONSTRAINT `OpenAIParams_engineId_fkey` FOREIGN KEY (`engineId`) REFERENCES `Engine`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Price` ADD CONSTRAINT `Price_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Topic` ADD CONSTRAINT `Topic_activityId_fkey` FOREIGN KEY (`activityId`) REFERENCES `Activity`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StoryTopic` ADD CONSTRAINT `StoryTopic_promptId_fkey` FOREIGN KEY (`promptId`) REFERENCES `Prompt`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StoryTopic` ADD CONSTRAINT `StoryTopic_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `Topic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Quiz` ADD CONSTRAINT `Quiz_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `Topic`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Quiz` ADD CONSTRAINT `Quiz_promptId_fkey` FOREIGN KEY (`promptId`) REFERENCES `Prompt`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Quiz` ADD CONSTRAINT `Quiz_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuizEntry` ADD CONSTRAINT `QuizEntry_quizId_fkey` FOREIGN KEY (`quizId`) REFERENCES `Quiz`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Log` ADD CONSTRAINT `Log_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Log` ADD CONSTRAINT `Log_promptId_fkey` FOREIGN KEY (`promptId`) REFERENCES `Prompt`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Waitlist` ADD CONSTRAINT `Waitlist_invitedById_fkey` FOREIGN KEY (`invitedById`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Faq` ADD CONSTRAINT `Faq_languageId_fkey` FOREIGN KEY (`languageId`) REFERENCES `Language`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
