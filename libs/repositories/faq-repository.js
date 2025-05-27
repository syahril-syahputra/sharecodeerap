const Sentry = require("@sentry/node");
const prisma = require("../lib-prisma");

const faqRepository = {

    findByLanguage: async (languageId) => {
        try {
            const faqs = await prisma.faq.findMany({
                where: {
                    languageId: languageId
                },
                include: {
                    Language: true
                }
            });
            return faqs;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

}

module.exports = faqRepository;