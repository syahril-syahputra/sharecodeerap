require('dotenv-safe').config({allowEmptyValues: true});

const Sentry = require("@sentry/node");

const questionsService = require("../libs/service/predefinedQuestionsService");
const prisma = require("../libs/lib-prisma");
const generatePointsForCountry = require("./maps/generatePois");

const processPrompt = async () => {
    try {

        let languages = [66];
        // let languages = [38];
        const topics = await prisma.topic.findMany({});
        const ageRanges = await prisma.ageRange.findMany({});
        const promises = [];

        for (const languageId of languages) {
            for (const topic of topics) {
                for (const ageRange of ageRanges) {
                    console.log("generating for languageId: " + languageId + " and topicId: " + topic.name + " and ageRangeId: " + ageRange.id);
                    await questionsService.generate4QuestionsPerLanguageTopicAndAgeRange(topic.id, ageRange.id, languageId);
                }
            }
        }

        Promise.all(promises)
            .then(() => {
                console.log("All function calls completed.");
            })
            .catch(error => {
                console.error("An error occurred:", error);
            });

    } catch (e) {
        console.error(e);
        Sentry.captureException(e);
    }
}

// const generate = async (languageId, topicId) => {
//     try {
//
//         const ageRanges = await prisma.ageRange.findMany({});
//         const promises = [];
//
//         for (const ageRange of ageRanges) {
//             promises.push(questionsService.generate4QuestionsPerLanguageTopicAndAgeRange(topicId, ageRange.id, languageId));
//         }
//
//         return Promise.all(promises)
//             .then(() => {
//                 console.log("All function calls completed.");
//             })
//             .catch(error => {
//                 console.error("An error occurred:", error);
//             });
//
//     } catch (e) {
//         console.error(e);
//         Sentry.captureException(e);
//     }
// }

processPrompt();