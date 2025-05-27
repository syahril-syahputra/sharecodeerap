const statuscodes = require("../helpers/statuscodes");
const Sentry = require("@sentry/node");
const render = require("../helpers/render");
const {
    followStories: savedStory,
    createContinousPrompt,
} = require("../repositories/followStory-repository");
const Joi = require("joi");
const { followStoryGPT } = require("../service/gptService");
const {
    updateFollowStoryPrompt,
} = require("../repositories/prompt-repository");
const usageService = require("../service/usageService");
const { createPrompt } = require("../service/promptService");
const { PromptType, LogType } = require("@prisma/client");
const logService = require("../service/logService");

module.exports = {
    followStory: async (req, res) => {
        const start = new Date().getTime();
        try {
            if (
                req.user.account.subscriptionStatus !== "active" &&
                req.user.account.subscriptionStatus !== "trialing"
            ) {
                render(res, 400, statuscodes.SUBSCRIPTION_NOT_ACTIVE, {
                    text: "Subscription not active",
                });
                return;
            } else if (
                !(await usageService.accountHasEnoughTokens(req.user.account))
            ) {
                render(res, 400, statuscodes.NOT_ENOUGH_TOKENS, {
                    text: "Looks like you run out of tokens this month",
                });
                return;
            }

            const { id } = req.params;
            const schema = Joi.object({
                message: Joi.string().required(),
            });

            const { error, value } = schema.validate(req.body);

            if (error) {
                render(res, 400, statuscodes.VALIDATION_ERROR, {});
                return;
            }

            const findSavedStory = await savedStory(parseInt(id), value);
            if (!findSavedStory) {
                render(res, 404, statuscodes.NOT_FOUND, {});
                return;
            }
            const startTime = Date.now();

            const response = await followStoryGPT(
                req.user,
                findSavedStory.Prompt,
                value.message
            );

            // TODO create the prompt
            let prompt = await createPrompt({
                request: req.body.message,
                response: response.text || "",
                responseTime: Date.now() - startTime || 0,
                promptToken: response.prompt_tokens || 0,
                completionToken: response.completion_tokens || 0,
                totalTokens: response.total_tokens || 0,
                type: PromptType.CUSTOM_STORY,
                isCorrect: null,
                userId: req.user.id,
                funFactsScore: null,
                learnMoreScore: null,
                fullRequest: JSON.stringify({
                    request: response.fullRequest,
                    language: req.user.Language,
                    voice: req.user.voiceCode || "",
                }),
            });
            delete prompt.fullRequest;

            let continous = await createContinousPrompt(
                prompt.id,
                findSavedStory.id
            );
            await logService.createLog(req, {
                type: LogType.GPT,
                message: `Generate Continous Custom Story at ${new Date()} by user with id : ${
                    req.user.id
                }`,
            });
            //TODO don't return the full response, use the other gpt requests as example of what it has to be returned
            render(res, 200, statuscodes.OK, prompt);
        } catch (e) {
            let responseTime = new Date().getTime() - start;
            console.error(e?.response);
            logService.createErrorLog(req, {
                message: e.message,
                description: `GPT Funfacts \n ${e.stack}`,
                type: "GPT",
                responseTime: parseInt(responseTime.toFixed(2)),
            });
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
};
