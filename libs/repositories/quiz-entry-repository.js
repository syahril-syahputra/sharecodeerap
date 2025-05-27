const Sentry = require("@sentry/node");
const prisma = require("../lib-prisma");

const quizEntryRepository = {


    findOneById: async (quizEntryId) => {
        try {
            const quizEntry = await prisma.quizEntry.findFirst({
                where: {
                    id: quizEntryId
                },
                include:{
                    quiz: true
                }
            });

            return quizEntry;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    createAnswer: async (quizEntryId, value) => {
        try {
            let quiz = await prisma.quizEntry.update({
                where: {
                    id: quizEntryId
                },
                data: {
                    isCorrect: value,
                    repliedAt: new Date(),
                }
            });

            return quiz;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
}

module.exports = quizEntryRepository;