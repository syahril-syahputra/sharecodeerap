const statuscodes = require('../helpers/statuscodes');
const Sentry = require("@sentry/node");
const render = require('../helpers/render');
const {getPaginationParameters} = require("../helpers/pagination");
const ActivityRepository = require("../repositories/activity-repository");
const logService = require('../service/logService');
const { LogType, PromptType } = require('@prisma/client');
const quizRepository = require('../repositories/quiz-repository');
const sessionRepository = require('../repositories/prompt-repository');

const activityController = {

    getAllActivities: async (req, res) => {
        try {
            let activities = await ActivityRepository.getAllActivities();

            await logService.createLog(req, {type : LogType.GET_ACTIVITIES, message : `Get all activities by user with id : ${req.user.id}`})
            
            render(res, 200, statuscodes.OK, activities);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

    getActivitiesPaginated: async (req, res) => {
        try {
            let paginationParameters = getPaginationParameters(req);
            let result = await ActivityRepository.getActivitiesPaginated(paginationParameters);
            await Promise.all(result.activities.map( async activity => {
                activity.totalFactsCompleted = await sessionRepository.getUserFinishedActivity(req.user.id, activity.id, PromptType.FACT);
                activity.totalQuizCompleted = await quizRepository.getUserFinishedQuizActivity(req.user.id, activity.id);
                activity.totalTopics = activity.Topic.length;
                delete activity.Topic;
            }));

            await logService.createLog(req, {type : LogType.GET_ACTIVITIES, message : `Get activities paginated by user with id : ${req.user.id}`})
            
            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

}
module.exports = activityController;


