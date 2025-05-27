const Sentry = require("@sentry/node");
const {
    openAITokensSpentPerAccount,
    charactersSentToGooglePerAccount,
    openAITokensSpentGlobally,
    charactersSentToGoogleGlobally,
    getPromptsById,
    getPromptCustomToken,
} = require("../repositories/prompt-repository");
const { getProductById } = require("../repositories/product-repository");
const { getPlanById } = require("../repositories/plan-repository");
const redis = require("../lib-ioredis");
const prisma = require("../lib-prisma");

const usageService = {
    // This service returns
    // openAI tokens spent per date range
    // openAI cost for Mediatropy per date range
    // openAI eureka tokens spent per date range
    // ttsCharacters sent per date range
    // ttsCharacters cost for Mediatropy per date range
    // ttsCharacters eureka tokens spent per date range
    // total spent eureka tokens per date range
    // revenue of this account per date range based on the current plan
    accountUsage: async (accountId, startDate, endDate) => {
        try {
            let openAiTokensSpent = await openAITokensSpentPerAccount(
                accountId,
                startDate,
                endDate
            );

            // Now since we have the totalTokens for the period, we can calculate the cost for Mediatropy
            let openAiTokenCost =
                process.env.COST_PER_TOKEN_USD * openAiTokensSpent;

            // TTS Spent
            let charsSentToGoogle = await charactersSentToGooglePerAccount(
                accountId,
                startDate,
                endDate
            );

            // TTS Cost
            let ttsCost = process.env.COST_PER_TTS_CHAR_USD * charsSentToGoogle;

            // Now we can calculate the eureka tokens spent
            let eurekaTokensSpent =
                process.env.RATIO_EUREKA_TO_OPENAI_TOKENS * openAiTokensSpent +
                process.env.RATIO_EUREKA_TO_TTS_CHARS * charsSentToGoogle;
            return {
                openAiSpent: openAiTokensSpent,
                openAiCost: openAiTokenCost,
                ttsCharactersSent: charsSentToGoogle,
                ttsCost: ttsCost,
                eurekaSpent: eurekaTokensSpent,
            };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    globalUsage: async (startDate, endDate) => {
        try {
            let openAiTokensSpent = await openAITokensSpentGlobally(
                startDate,
                endDate
            );

            // Now since we have the totalTokens for the period, we can calculate the cost for Mediatropy
            let openAiTokenCost =
                process.env.COST_PER_TOKEN_USD * openAiTokensSpent;

            // TTS Spent
            let charsSentToGoogle = await charactersSentToGoogleGlobally(
                startDate,
                endDate
            );

            // TTS Cost
            let ttsCost = process.env.COST_PER_TTS_CHAR_USD * charsSentToGoogle;

            // Now we can calculate the eureka tokens spent
            let eurekaTokensSpent =
                process.env.RATIO_EUREKA_TO_OPENAI_TOKENS * openAiTokensSpent +
                process.env.RATIO_EUREKA_TO_TTS_CHARS * charsSentToGoogle;
            return {
                openAiSpent: openAiTokensSpent,
                openAiCost: openAiTokenCost,
                ttsCharactersSent: charsSentToGoogle,
                ttsCost: ttsCost,
                eurekaSpent: eurekaTokensSpent,
            };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    eurekaTokensSpent: async (accountId, startDate, endDate) => {
        try {
            let openAiTokensSpent = await openAITokensSpentPerAccount(
                accountId,
                startDate,
                endDate
            );
            let charsSentToGoogle = await charactersSentToGooglePerAccount(
                accountId,
                startDate,
                endDate
            );
            let eurekaTokensSpent =
                process.env.RATIO_EUREKA_TO_OPENAI_TOKENS * openAiTokensSpent +
                process.env.RATIO_EUREKA_TO_TTS_CHARS * charsSentToGoogle;

            const customToken = await getPromptCustomToken(accountId);

            return {
                tokensUsed: eurekaTokensSpent + customToken,
                tokens: openAiTokensSpent,
            };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    accountHasEnoughTokens: async (account) => {
        try {
            let openAiTokensSpent = await openAITokensSpentPerAccount(
                account.id,
                account.subscriptionCurrentPeriodStart,
                account.subscriptionCurrentPeriodEnd
            );
            let charsSentToGoogle = await charactersSentToGooglePerAccount(
                account.id,
                account.subscriptionCurrentPeriodStart,
                account.subscriptionCurrentPeriodEnd
            );
            let eurekaTokensSpent =
                process.env.RATIO_EUREKA_TO_OPENAI_TOKENS * openAiTokensSpent +
                process.env.RATIO_EUREKA_TO_TTS_CHARS * charsSentToGoogle;
            let product;
            if (account.planId) product = await getPlanById(account.planId);
            else product = await getProductById(account.productId);

            
            const customToken = await getPromptCustomToken(account.id);
            if(customToken) eurekaTokensSpent = eurekaTokensSpent + customToken;

            if (eurekaTokensSpent > product.tokens) {
                await redis.publish(
                    "mattermost:userreachmaxtokens",
                    JSON.stringify({
                        message: `${account.email} reached maximum token usage`,
                    })
                );
            }
            return eurekaTokensSpent < product.tokens;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
};
module.exports = usageService;
