const render = require("../../helpers/render");
const statuscodes = require("../../helpers/statuscodes");
const Sentry = require("@sentry/node");
const {getPaginationParameters} = require("../../helpers/pagination");
const {createDefaultPromptDB, deleteOpenAIParamDB, editOpenAIParamDB, getAllOpenAIParams, getOpenAIParam, getAllEngines} = require("../../repositories/admin/openai-params-repository");
const Joi = require("joi");
const {findAdminUserById} = require("../../repositories/admin-repository");
const adminDefaultPromptController = {
    createOpenAIParam:  async (req, res) => {
        try {

            const schema = Joi.object({
                name: Joi.string(),
                temperature: Joi.number().required(),
                maxTokens: Joi.number().required(),
                topP: Joi.number().required(),
                systemPrompt: Joi.string().required(),
                assistantPrompt: Joi.string().allow(''),
                userPrompt: Joi.string().allow(''),
                prompt: Joi.string().required(),
                frequencyPenalty: Joi.number().required(),
                presencePenalty: Joi.number().required(),
                bestOf: Joi.number().integer().required(),
                engineId: Joi.number().integer().required()
            });

            const {error, value} = schema.validate(req.body);
            if (error) {
                render(res, 400, statuscodes.VALIDATION_ERROR, error);
                return;
            }

            value.createdById = req.userId;
            let result = await createDefaultPromptDB(value)

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    editOpenAIParam:  async (req, res) => {
        try {
            const schema = Joi.object({
                name: Joi.string(),
                temperature: Joi.number().required(),
                maxTokens: Joi.number().required(),
                topP: Joi.number().required(),
                systemPrompt: Joi.string().required(),
                assistantPrompt: Joi.string().allow(''),
                userPrompt: Joi.string().allow(''),
                prompt: Joi.string().required(),
                frequencyPenalty: Joi.number().required(),
                presencePenalty: Joi.number().required(),
                bestOf: Joi.number().integer().required(),
                engineId: Joi.number().integer().required()
            });

            const {error, value} = schema.validate(req.body);
            if (error) {
                render(res, 400, statuscodes.VALIDATION_ERROR, error);
                return;
            }

            let result = await editOpenAIParamDB(value, parseInt(req.params.id))

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    getOpenAIParams:  async (req, res) => {
        try {
            let paginationParameters = getPaginationParameters(req);
            let result = await getAllOpenAIParams(paginationParameters)

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    listEngines:  async (req, res) => {
        try {
            let paginationParameters = getPaginationParameters(req);
            let result = await getAllEngines(paginationParameters)

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    deleteOpenAIParam:  async (req, res) => {
        try {
            let result = await deleteOpenAIParamDB(parseInt(req.params.id));

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    getOpenAIParamDetail:  async (req, res) => {
        try {
            let result = await getOpenAIParam(parseInt(req.params.id));

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
}

module.exports = adminDefaultPromptController;