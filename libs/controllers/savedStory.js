const statuscodes = require("../helpers/statuscodes");
const Sentry = require("@sentry/node");
const render = require("../helpers/render");
const Joi = require("joi");
const {
    addNewSavedStory,
    fetchAllSavedStories,
    getOneSavedStory,
    destroySavedStory,
} = require("../repositories/savedStory-repository");
const { getTosById } = require("../repositories/typeOfStory-repository");
const {
    getStoryParamByIdIncludingTopic,
} = require("../repositories/storyParams-repository");
const { processTypeOfStoryGPT } = require("../service/gptService");
const { createPrompt } = require("../service/promptService");
const { PromptType, LogType } = require("@prisma/client");
const usageService = require("../service/usageService");
const logService = require("../service/logService");

module.exports = {
    getAllSavedStories: async (req, res) => {
        try {
            const savedStories = await fetchAllSavedStories(req);
            render(res, 200, statuscodes.OK, savedStories);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
    getDetailSavedStory: async (req, res) => {
        try {
            const { id } = req.params;
            const savedStory = await getOneSavedStory(req, parseInt(id));
            if (!savedStory) {
                render(res, 404, statuscodes.NOT_FOUND, {});
                return;
            }
            if (savedStory.userId !== req.user.id) {
                render(res, 400, statuscodes.NOT_ALLOWED, {});
                return;
            }
            render(res, 200, statuscodes.OK, savedStory);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
    deleteSavedStory: async (req, res) => {
        try {
            const { id } = req.params;
            const deleteSavedStory = await destroySavedStory(parseInt(id));
            if (!deleteSavedStory) {
                render(res, 404, statuscodes.NOT_FOUND, {});
                return;
            }
            render(res, 200, statuscodes.OK, {});
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
    addSavedStory: async (req, res) => {
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

            const schema = Joi.object({
                typeOfStoryId: Joi.number().required(),
                storyParam: Joi.array()
                    .items(
                        Joi.object({
                            id: Joi.number().required(),
                            topicId: Joi.number().required(),
                        })
                    )
                    .required(),
            });
            const { body } = req;
            const { value, error } = schema.validate(body);
            const { typeOfStoryId, storyParam } = value;

            if (error) {
                render(res, 400, statuscodes.VALIDATION_ERROR, {});
                return;
            }

            const typeOfStory = await getTosById(typeOfStoryId);

            // TODO change this to only one query using the array IN operator
            let storyParams = [];
            for (let i = 0; i < storyParam.length; i++) {
                storyParams.push(
                    await getStoryParamByIdIncludingTopic(storyParam[i])
                );
            }

            const startTime = Date.now();

            const response = await processTypeOfStoryGPT(
                req.user,
                typeOfStory,
                storyParams
            );

            const { title, story } = response.result;

            const prompt = await createPrompt({
                request:
                    response.fullRequest.messages[
                        response.fullRequest.messages.findIndex(
                            (e) => e.role == "user"
                        )
                    ].content || "",
                response: story || "",
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
            const { id: promptId } = prompt;
            const data = {
                title,
                typeOfStoryId,
                promptId,
                userId: req.user.id,
            };

            const result = await addNewSavedStory(data, storyParams);

            // TODO logs

            delete prompt.id;
            await logService.createLog(req, {
                type: LogType.GPT,
                message: `Generate Custom Story at ${new Date()} by user with id : ${
                    req.user.id
                }`,
            });

            render(res, 201, statuscodes.OK, {
                id: result.savedStory.id,
                title,
                ...prompt,
            });
        } catch (e) {
            console.log(e);
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
