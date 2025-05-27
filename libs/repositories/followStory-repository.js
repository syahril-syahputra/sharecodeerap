const Sentry = require("@sentry/node");
const prisma = require("../lib-prisma");

module.exports = {
    followStories: async (id) => {
        try {
            const result = await prisma.savedStory.findFirst({
                where: {
                    id,
                },
                include: {
                    Prompt: true,
                },
            });

            if (!result) return null;
            return result;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    createContinousPrompt: async (promptId, savedStoryId) => {
        try {
            const create = await prisma.continousSavedStory.create({
                data: {
                    promptId,
                    savedStoryId,
                },
            });

            return create;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
};
