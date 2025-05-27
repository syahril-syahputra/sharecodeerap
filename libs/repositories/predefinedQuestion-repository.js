const Sentry = require("@sentry/node");
const prisma = require("../lib-prisma");

const predefinedQuestionRepository = {
    get4RandomizedQuestion: async ({ age, userLevelId, languageId }) => {
        try {

            const result = await prisma.predefinedQuestions.findMany({
                where: {
                    AgeRange: {
                        maxAge: {
                            gte: parseInt(age),
                        },
                        minAge: {
                            lte: parseInt(age),
                        },
                    },
                    Topic:{
                        userLevelId: userLevelId,
                    },
                    languageId: languageId,
                },
                include: {
                    AgeRange: true,
                    Language: true,
                    Topic: true,
                },
                distinct : "topicId"
            });
            const randomizeResult = (arr) => {
                const newArray = [...arr]; // Create a copy of the array
                for (let i = newArray.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1)); // Generate a random index
                    [newArray[i], newArray[j]] = [newArray[j], newArray[i]]; // Swap elements
                }
                return newArray;
            };

            return randomizeResult(result).slice(0, 4);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getPredefinedByQuestion : async (question) => {
        try {
            const predefined = await prisma.predefinedQuestions.findFirst({
                where : {
                    question : question
                },
                include : {
                    Topic : true
                }
            })

            return predefined;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    }
};

module.exports = predefinedQuestionRepository;
