const Sentry = require("@sentry/node");
const prisma = require("../../lib-prisma");

const defaultPromptRepository = {
    createDefaultPromptDB: async (data) => {
        try {
            let defaultPrompt = await prisma.defaultPrompt.create({
                data: data,
            });

            return defaultPrompt;
        } catch (e) {
            console.log("error disini karna")
            console.log(e)
            console.error(e);
            Sentry.captureException(e);
        }
    },
    editDefaultPromptDB: async (data, defaultPromptId) => {
        try {
            let defaultPrompt = await prisma.defaultPrompt.update({
                where: {
                    id: defaultPromptId,
                },
                data: data,
                include: {
                    mainParams: true,
                    spellMoreParams: true,
                    explainMoreParams: true,
                    funFactsParams: true,
                    metadataParams: true,
                    storyParams: true,
                    quizParams: true,
                    factParams: true,
                    country: true,
                    quizExplainMoreParams: true,
                    customStoryParams: true,
                    dalleParams: true,
                },
            });

            return defaultPrompt;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getAllDefaultPrompts: async (paginationParameters) => {
        try {
            const defaultPrompts = await prisma.defaultPrompt.findMany({
                ...paginationParameters,
                include: {
                    mainParams: true,
                    spellMoreParams: true,
                    explainMoreParams: true,
                    funFactsParams: true,
                    metadataParams: true,
                    storyParams: true,
                    quizParams: true,
                    factParams: true,
                    country: true,
                    quizExplainMoreParams: true,
                    customStoryParams: true,
                    IdleParams: true,
                    continuePromptParams: true,
                    dalleParams: true,
                },
            });

            const numDefaultPrompts = await prisma.defaultPrompt.count();

            return {
                defaultPrompts: defaultPrompts,
                pagination: {
                    ...paginationParameters,
                    total: numDefaultPrompts,
                },
            };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    deleteDefaultPromptDB: async (defaultPromptId) => {
        try {
            const defaultPrompt = await prisma.defaultPrompt.delete({
                where: {
                    id: defaultPromptId,
                },
            });

            return defaultPrompt;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getDefaultPrompt: async (defaultPromptId) => {
        try {
            const defaultPrompt = await prisma.defaultPrompt.findUnique({
                where: {
                    id: defaultPromptId,
                },
                include: {
                    mainParams: true,
                    spellMoreParams: true,
                    explainMoreParams: true,
                    funFactsParams: true,
                    metadataParams: true,
                    storyParams: true,
                    quizParams: true,
                    factParams: true,
                    country: true,
                    quizExplainMoreParams: true,
                    customStoryParams: true,
                    IdleParams: true,
                    continuePromptParams: true,
                    dalleParams: true,
                    quizPromptParams: true,
                    contextParams: true,
                    emojisParams: true,
                },
            });

            return defaultPrompt;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
};

module.exports = defaultPromptRepository;
