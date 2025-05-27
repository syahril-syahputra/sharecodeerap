const Sentry = require("@sentry/node");
const prisma = require("../lib-prisma");

const languageRepository = {

    getLanguages: async () => {
        try {
            const languages = await prisma.language.findMany();
            return languages;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    getLanguagesById: async (languageId) => {
        try {
            const language = await prisma.language.findFirst({
                where: {
                    id: languageId
                }
            });

            return language;
            
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    getLanguagesByISO: async (iso) => {
        try {
            const language = await prisma.language.findFirst({
                where: {
                    iso: iso
                }
            });

            return language;
            
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    languageExists: async (languageId) => {
        try {
            const count = await prisma.language.count({
                where: {
                    id: languageId
                }
            });

            return count>0;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
}

module.exports = languageRepository;