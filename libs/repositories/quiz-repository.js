const Sentry = require("@sentry/node");
const prisma = require("../lib-prisma");

const quizRepository = {

    getQuizzes: async (paginationParameters, userId) => {
        try {
            const quizzes = await prisma.quiz.findMany({
                ...paginationParameters,
                where: {
                    userId: userId
                },
            });

            const numQuizzes = await prisma.quiz.count({
                where : {
                    userId: userId
                }
            });

            return {quizzes: quizzes, pagination: {...paginationParameters, total: numQuizzes}};
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    findOneById: async (quizId) => {
        try {
            const quiz = await prisma.quiz.findFirst({
                where: {
                    id: quizId
                },
                include:{
                    QuizEntry: true
                }
            });

            return quiz;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    finishQuiz: async (quizId) => {
        try {
            const quiz = await prisma.quiz.update({
                where: {
                    id: quizId
                },
                data: {
                    finished: true
                },
                include:{
                    QuizEntry: true
                }
            });

            return quiz;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    activitiesList : async (userId) => {
        try {
            const quiz = await prisma.quiz.findMany({
                where : {
                    
                }
            })
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    getUserFinishedQuizActivity : async (userId, activityId) => {
        try {
            const quiz = await prisma.quiz.findMany({
                where: {
                    userId: userId,
                    finished: true, 
                    topic: {
                        activityId: activityId,
                    }, 
                },
                distinct: ['topicId']
            });

            return quiz.length;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    getUserFinishedQuizByTopic : async (userId, topicId) => {
        try {
            const quiz = await prisma.quiz.findFirst({
                where: {
                    userId: userId,
                    finished: true, 
                    topicId: topicId
                },
            });

            return quiz ? true : false;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    }
}

module.exports = quizRepository;