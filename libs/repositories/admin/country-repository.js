const Sentry = require("@sentry/node");
const prisma = require("../../lib-prisma");

const languageRepository = {

    getAllCountries: async (paginationParameters) => {
        try {
            const countries = await prisma.country.findMany({
                ...paginationParameters
            });

            const numCountries = await prisma.country.count();

            return {countries: countries, pagination: {...paginationParameters, total: numCountries}};
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

}

module.exports = languageRepository;