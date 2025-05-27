const statuscodes = require('../helpers/statuscodes');
const Sentry = require("@sentry/node");
const render = require('../helpers/render');
const {getPaginationParameters} = require("../helpers/pagination");
const TopicRepository = require("../repositories/topic-repository");
const logService = require('../service/logService');
const { LogType, PromptType } = require('@prisma/client');
const quizRepository = require('../repositories/quiz-repository');
const sessionRepository = require('../repositories/prompt-repository');

const topicController = {

    getAllTopics: async (req, res) => {
        try {
            let topics = await TopicRepository.getAllTopics(parseInt(req.params.activityId));
            await Promise.all(topics.map(async (topic) => {
                topic.finishedQuiz = await quizRepository.getUserFinishedQuizByTopic(req.user.id, topic.id);
                topic.finishedFact = await sessionRepository.getUserFinishedTopic(req.user.id, topic.id, PromptType.FACT);
            }));

            await logService.createLog(req, {type : LogType.GET_TOPICS_BY_ACTIVITY, message: `User with id : ${req.user.id} Get Topics by activity`})
            
            render(res, 200, statuscodes.OK, topics);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

    getTopicsPaginated: async (req, res) => {
        try {
            let paginationParameters = getPaginationParameters(req);
            let result = await TopicRepository.getTopicsPaginated(paginationParameters);

            await logService.createLog(req, {type : LogType.GET_TOPICS, message: `User with id : ${req.user.id} Get all topics paginated`})

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
    
    getAllRandomizeTopic : async (req, res) => {
        try {
            let paginationParameters = getPaginationParameters(req);
            const { id } = req.body
            let result = await TopicRepository.getAllRandomizeTopic(paginationParameters, id);

            await logService.createLog(req, {type : LogType.GET_TOPICS, message: `User with id : ${req.user.id} Get Random topic paginated`})

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

}
module.exports = topicController;


