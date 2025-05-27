const Sentry = require("@sentry/node");
const prisma = require("../../lib-prisma");

const predefinedQuestionRepository = {
    getAllQuestion: async (
        paginationParameters,
        query = "",
        languageId = null,
        level = null,
        age = null
    ) => {
        try {
            let where = {
                question: {
                    contains: query,
                },
                languageId,
                Topic: {
                    userLevelId: level,
                },
                ageRangeId: age,
            };
            if (!languageId) delete where.languageId;
            if (!level) delete where.Topic;
            if (!age) delete where.ageRangeId;

            const questions = await prisma.predefinedQuestions.findMany({
                where,
                include: {
                    Language: true,
                    AgeRange: true,
                    Topic: {
                        include: {
                            UserLevel: true,
                        },
                    },
                },
                ...paginationParameters
            });

            const total = await prisma.predefinedQuestions.count({
                where
            })

            return { questions, pagination: { ...paginationParameters, total } };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    createQuestion: async (data) => {
        try {
            const result = await prisma.predefinedQuestions.create({
                data,
            });
            return result;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    updateQuestion: async (id, data) => {
        try {
            const result = await prisma.predefinedQuestions.update({
                where: {
                    id,
                },
                data,
            });
            return result;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    deleteQuestion: async (id) => {
        try {
            const result = await prisma.predefinedQuestions.delete({
                where: {
                    id,
                },
            });

            return result;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
};

module.exports = predefinedQuestionRepository;
