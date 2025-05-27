const Sentry = require("@sentry/node");
const prisma = require("../../lib-prisma");

const openAIParamsRepository = {
    createDefaultPromptDB: async (data) => {
        try {
            let defaultPrompt = await prisma.openAIParams.create({
                data: data,
            });

            return defaultPrompt;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    editOpenAIParamDB: async (data, openAIParamId) => {
        try {
            let defaultPrompt = await prisma.openAIParams.update({
                where: {
                  id: openAIParamId
                },
                data: data,
            });

            return defaultPrompt;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getAllOpenAIParams: async (paginationParameters) => {
        try {
            const openAIParams = await prisma.openAIParams.findMany({
                ...paginationParameters
            });

            const numOpenAIParams = await prisma.openAIParams.count();

            return {openAIParams: openAIParams, pagination: {...paginationParameters, total: numOpenAIParams}};
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getAllEngines: async (paginationParameters) => {
        try {
            const engines = await prisma.engine.findMany({
                ...paginationParameters
            });

            const numEngines = await prisma.engine.count();

            return {engines: engines, pagination: {...paginationParameters, total: numEngines}};
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    deleteOpenAIParamDB: async (openAIParamId) => {
        try {
            const openAIParam = await prisma.openAIParams.delete({
                where: {
                    id: openAIParamId,
                }
            });

            return openAIParam;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getOpenAIParam: async (openAIParamId) => {
        try {
            const openAIParam = await prisma.openAIParams.findUnique({
                where: {
                    id: openAIParamId,
                }
            });

            return openAIParam;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
}

module.exports = openAIParamsRepository;