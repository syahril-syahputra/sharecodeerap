const Sentry = require("@sentry/node");
const prisma = require("../../lib-prisma");

const engineRepository = {
    createEngineDB: async (data) => {
        try {
            let engine = await prisma.engine.create({
                data: data,
            });

            return engine;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    editEngineDB: async (data, engineId) => {
        try {
            let engine = await prisma.engine.update({
                where: {
                  id: engineId
                },
                data: data,
            });

            return engine;
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
    deleteEngineDB: async (engineId) => {
        try {
            const engine = await prisma.engine.delete({
                where: {
                    id: engineId,
                }
            });

            return engine;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
}

module.exports = engineRepository;