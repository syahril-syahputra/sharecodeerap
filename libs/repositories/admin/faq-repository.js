const Sentry = require("@sentry/node");
const prisma = require("../../lib-prisma");

const faqRepository = {
    createFaqDB: async (data) => {
        try {
            let faq = await prisma.faq.create({
                data: data,
            });

            return faq;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    editFaqDB: async (data, faqId) => {
        try {
            let faq = await prisma.faq.update({
                where: {
                  id: faqId
                },
                data
            });
            return faq;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getAllFaqs: async (paginationParameters) => {
        try {
            const faqs = await prisma.faq.findMany({
                include: {
                    Language: true,
                },
                ...paginationParameters
            });

            const numFaqs = await prisma.faq.count();

            return {faqs: faqs, pagination: {...paginationParameters, total: numFaqs}};
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    deleteFaqDB: async (faqId) => {
        try {
            const faq = await prisma.faq.delete({
                where: {
                    id: faqId,
                }
            });

            return faq;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
}

module.exports = faqRepository;