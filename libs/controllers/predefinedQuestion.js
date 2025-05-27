const statuscodes = require('../helpers/statuscodes');
const Sentry = require("@sentry/node");
const render = require('../helpers/render');
const { get4RandomizedQuestion, getPredefinedByQuestion } = require('../repositories/predefinedQuestion-repository');
const dateHelper = require("../helpers/datehelper");
const usageService = require("../service/usageService");
const PromptType = require("../helpers/enums/PromptType");
const promptService = require("../service/promptService");
const sessionRepository = require("../repositories/session-repository");
const userLevelService = require("../service/userLevelsService");
const logService = require("../service/logService");
const {LogType} = require("@prisma/client");
const Joi = require("joi");
const redis = require('../lib-ioredis');

const predefinedQuestion = {
    getRandomizedQuestion : async (req, res) => {
        try {
            const { birthday, userLevelId, languageId } = req.user
            const age = dateHelper.calculateAge(birthday);
            const result = await get4RandomizedQuestion({age, userLevelId, languageId})

            render(res, 200, statuscodes.OK, result)
        } catch (e) {
            render(res, 500, statuscodes.INTERNAL_ERROR, {})
            Sentry.captureException(e)
            console.error(e)
        }
    },
    
    addQuestion : async (req, res) => {
        try {

            if(req.user.account.subscriptionStatus !== 'active' && req.user.account.subscriptionStatus !== 'trialing'){
                render(res, 200, statuscodes.SUBSCRIPTION_NOT_ACTIVE, { text: "Subscription not active" });
                return;
            }else if(!await usageService.accountHasEnoughTokens(req.user.account)){
                render(res, 200, statuscodes.NOT_ENOUGH_TOKENS, { text: "Looks like you run out of tokens this month" });
                return;
            }

            const schema = Joi.object({
                question: Joi.string().required(),
            });
            const {error, value} = schema.validate(req.body);
            if (error) {
                render(res, 400, statuscodes.VALIDATION_ERROR, error);
                return;
            }
            const predefined = await getPredefinedByQuestion(value.question);
            if (!predefined){
                render(res, 404, statuscodes.NOT_FOUND, { text: "Predefined question not found" });
                return;
            }

            await redis.publish(
                "mattermost:userpredefinedquestion",
                JSON.stringify({
                    userEmail: req.user.email,
                    topic : predefined.Topic.name,
                    predefinedQuestion : value.question
                })
            );
            

            let prompt = await promptService.createPrompt({
                sessionId: null,
                request: value.question,
                response: value.question,
                responseTime: 0,
                promptToken: 0,
                completionToken: 0,
                totalTokens: 0,
                type: PromptType.PREDEFINED_QUESTION,
                userId: req.user.id,
                fullRequest: `PREDEFINED QUESTION: ${value.question}`,
            });

            await logService.createLog(req, { type : LogType.GPT, message: `Predefined question : ${req.user.id}`, promptId : prompt.id})

            render(res, 200, statuscodes.OK, prompt)
        } catch (e) {
            render(res, 500, statuscodes.INTERNAL_ERROR, {})
            Sentry.captureException(e)
            console.error(e)
        }
    }
}

module.exports = predefinedQuestion