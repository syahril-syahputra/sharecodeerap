const Sentry = require("@sentry/node");
const prisma = require("../../lib-prisma");

const quizRepository = {
    getQuizzesByUser: async (paginationParameters, userId, search) => {
        try {
            const quizzes = await prisma.quiz.findMany({
                ...paginationParameters,
                ...(search != null
                    ? {
                          where: {
                              userId: userId,
                              topic: {
                                  OR: [
                                      {
                                          name: {
                                              contains: search,
                                          },
                                      },
                                      {
                                          name_cn: {
                                              contains: search,
                                          },
                                      },
                                      {
                                          name_ct: {
                                              contains: search,
                                          },
                                      },
                                      {
                                          name_fr: {
                                              contains: search,
                                          },
                                      },
                                      {
                                          name_es: {
                                              contains: search,
                                          },
                                      },
                                      {
                                          name_id: {
                                              contains: search,
                                          },
                                      },
                                  ],
                              },
                          },
                      }
                    : {
                          where: {
                              userId: userId,
                          },
                      }),
                include: {
                    QuizEntry: true,
                    prompt: true,
                    topic: true,
                },
            });

            const numQuizzes = await prisma.quiz.count({
                where: {
                    userId: userId,
                },
            });

            return {
                quizzes: quizzes,
                pagination: { ...paginationParameters, total: numQuizzes },
            };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getCompleteQuizzesByUser: async (paginationParameters, userId) => {
        try {
            const quizzes = await prisma.quiz.findMany({
                where: {
                    userId: userId,
                    finished: true,
                },
                select: {
                    id: true,
                },
            });
            const allQuizzId = quizzes.map((e) => {
                return e.id;
            });
            const question = await prisma.quizEntry.findMany({
                where: {
                    quizId: {
                        in: allQuizzId,
                    },
                },
                ...paginationParameters,
            });
            const numQuizzes = await prisma.quizEntry.count({
                where: {
                    quizId: {
                        in: allQuizzId,
                    },
                },
            });

            return {
                quizzes: question,
                pagination: { ...paginationParameters, total: numQuizzes },
            };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
};

module.exports = quizRepository;
