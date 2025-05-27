const Sentry = require("@sentry/node");
const prisma = require("../lib-prisma");

const defaultPromptRepository = {
    getDefaultPromptByAgeAndLanguage: async (language, age) => {
        try {
            const defaultPrompt = await prisma.defaultPrompt.findFirst({
                where: {
                    languageId: parseInt(language),
                    maxAge: {
                        lte: age,
                    },
                    minAge: {
                        gte: age,
                    },
                    inUse: true,
                },
            });

            return defaultPrompt;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    getDefaultPromptByLanguage: async (language) => {
        try {
            const defaultPrompt = await prisma.defaultPrompt.findFirst({
                where: {
                    languageId: parseInt(language),
                    inUse: true,
                },
            });

            return defaultPrompt;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    getDefaultPromptByAge: async (age) => {
        try {
            const defaultPrompt = await prisma.defaultPrompt.findFirst({
                where: {
                    maxAge: {
                        lte: age,
                    },
                    minAge: {
                        gte: age,
                    },
                    inUse: true,
                },
            });

            return defaultPrompt;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    getDefaultPrompt: async () => {
        try {
            const defaultPrompt = await prisma.defaultPrompt.findFirst({
                where: {
                    inUse: true,
                },
            });
            return defaultPrompt;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    getPromptByIdForMetadata: async (id) => {
        try {
            const defaultPrompt = await prisma.defaultPrompt.findFirst({
                where: {
                    inUse: true,
                    id: id,
                },
                include: {
                    metadataParams: {
                        include: {
                            Engine: true,
                        },
                    },
                },
            });
            return defaultPrompt;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    getPromptByIdForStory: async (id) => {
        try {
            const defaultPrompt = await prisma.defaultPrompt.findFirst({
                where: {
                    inUse: true,
                    id: id,
                },
                include: {
                    storyParams: {
                        include: {
                            Engine: true,
                        },
                    },
                },
            });
            return defaultPrompt;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getPromptByIdForCustomStory: async (id) => {
        try {
            const defaultPrompt = await prisma.defaultPrompt.findFirst({
                where: {
                    inUse: true,
                    id: id,
                },
                include: {
                    customStoryParams: {
                        include: {
                            Engine: true,
                        },
                    },
                },
            });
            return defaultPrompt;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    getPromptByIdForFact: async (id) => {
        try {
            const defaultPrompt = await prisma.defaultPrompt.findFirst({
                where: {
                    inUse: true,
                    id: id,
                },
                include: {
                    factParams: {
                        include: {
                            Engine: true,
                        },
                    },
                },
            });
            return defaultPrompt;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getPromptByIdForContinuePrompt: async (id) => {
        try {
            const defaultPrompt = await prisma.defaultPrompt.findFirst({
                where: {
                    inUse: true,
                    id: id,
                },
                include: {
                    continuePromptParams: {
                        include: {
                            Engine: true,
                        },
                    },
                },
            });
            return defaultPrompt;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    getPromptByIdForQuiz: async (id) => {
        try {
            const defaultPrompt = await prisma.defaultPrompt.findFirst({
                where: {
                    inUse: true,
                    id: id,
                },
                include: {
                    quizParams: {
                        include: {
                            Engine: true,
                        },
                    },
                },
            });
            return defaultPrompt;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getPromptByIdForQuizUsingPrompt: async (id) => {
        try {
            const defaultPrompt = await prisma.defaultPrompt.findFirst({
                where: {
                    inUse: true,
                    id: id,
                },
                include: {
                    quizPromptParams: {
                        include: {
                            Engine: true,
                        },
                    },
                },
            });

            return defaultPrompt;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    getPromptByIdForQuizExplainMore: async (id) => {
        try {
            const defaultPrompt = await prisma.defaultPrompt.findFirst({
                where: {
                    inUse: true,
                    id: id,
                },
                include: {
                    quizExplainMoreParams: {
                        include: {
                            Engine: true,
                        },
                    },
                },
            });
            return defaultPrompt;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    getPromptForIdle: async (id) => {
        try {
            const defaultPrompt = await prisma.defaultPrompt.findFirst({
                where: {
                    inUse: true,
                    id: id,
                },
                include: {
                    IdleParams: {
                        include: {
                            Engine: true,
                        },
                    },
                },
            });
            return defaultPrompt;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    getPromptByIdForDalle: async (id) => {
        try {
            const defaultPrompt = await prisma.defaultPrompt.findFirst({
                where: {
                    inUse: true,
                    id: id,
                },
                include: {
                    dalleParams: {
                        include: {
                            Engine: true,
                        },
                    },
                },
            });
            return defaultPrompt;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getPromptByIdForContext: async (id) => {
        try {
            const defaultPrompt = await prisma.defaultPrompt.findFirst({
                where: {
                    inUse: true,
                    id: id,
                },
                include: {
                    contextParams: {
                        include: {
                            Engine: true,
                        },
                    },
                },
            });
            return defaultPrompt;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getPromptByIdForEmojis: async (id) => {
        try {
            const defaultPrompt = await prisma.defaultPrompt.findFirst({
                where: {
                    inUse: true,
                    id: id,
                },
                include: {
                    emojisParams: {
                        include: {
                            Engine: true,
                        },
                    },
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
