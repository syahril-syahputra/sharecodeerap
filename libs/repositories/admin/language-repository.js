const Sentry = require("@sentry/node");
const prisma = require("../../lib-prisma");

const languageRepository = {
    createLanguageDB: async (data) => {
        try {
            let language = await prisma.language.create({
                data: data,
            });

            return language;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    editLanguageDB: async (data, languageId) => {
        try {
            let language = await prisma.language.update({
                where: {
                  id: languageId
                },
                data: data,
            });

            return language;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getAllLanguages: async (paginationParameters) => {
        try {
            const languages = await prisma.language.findMany({
                ...paginationParameters
            });

            const numLanguages = await prisma.language.count();

            return {languages: languages, pagination: {...paginationParameters, total: numLanguages}};
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    deleteLanguageDB: async (languageId) => {
        try {
            const language = await prisma.language.delete({
                where: {
                    id: languageId,
                }
            });

            return language;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
}

module.exports = languageRepository;