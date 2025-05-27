const render = require("../../helpers/render");
const statuscodes = require("../../helpers/statuscodes");
const Sentry = require("@sentry/node");
const { getPaginationParameters } = require("../../helpers/pagination");
const {
    createDefaultPromptDB,
    deleteDefaultPromptDB,
    editDefaultPromptDB,
    getAllDefaultPrompts,
    getDefaultPrompt,
} = require("../../repositories/admin/defaultprompt-repository");
const Joi = require("joi");

const adminDefaultPromptController = {
    createDefaultPrompt: async (req, res) => {
        try {
            const schema = Joi.object({
                name: Joi.string(),
                inUse: Joi.boolean(),
                language: Joi.number().integer().required(),
                minAge: Joi.number().integer().required(),
                maxAge: Joi.number().integer().required(),
                country: Joi.number().integer().required(),
                mainParams: Joi.number().integer().required(),
                explainMoreParams: Joi.number().integer().required(),
                spellMoreParams: Joi.number().integer().required(),
                funFactsParams: Joi.number().integer().required(),
                metadataParams: Joi.number().integer().required(),
                storyParams: Joi.number().integer().required(),
                quizParams: Joi.number().integer().required(),
                factParams: Joi.number().integer().required(),
                quizExplainMoreParams: Joi.number().integer().required(),
                customStoryParams: Joi.number().integer().required(),
                IdleParams: Joi.number().integer().required(),
                continuePromptParams: Joi.number().integer().required(),
                dalleParams: Joi.number().integer().required(),
                quizPromptParams: Joi.number().integer().required(),
                contextParams: Joi.number().integer().required(),
                emojisParams: Joi.number().integer().required(),
            });
            const { error, value } = schema.validate(req.body);
            if (error) {
                render(res, 400, statuscodes.VALIDATION_ERROR, error);
                return;
            }
            // this connects the existing entity
            value.createdBy = {
                connect: { id: req.userId },
            };
            value.country = {
                connect: { id: value.country },
            };
            value.language = {
                connect: { id: value.language },
            };
            value.mainParams = {
                connect: { id: value.mainParams },
            };
            value.explainMoreParams = {
                connect: { id: value.explainMoreParams },
            };
            value.spellMoreParams = {
                connect: { id: value.spellMoreParams },
            };
            value.funFactsParams = {
                connect: { id: value.funFactsParams },
            };
            value.metadataParams = {
                connect: { id: value.metadataParams },
            };
            value.storyParams = {
                connect: { id: value.storyParams },
            };
            value.quizParams = {
                connect: { id: value.quizParams },
            };
            value.factParams = {
                connect: { id: value.factParams },
            };
            value.quizExplainMoreParams = {
                connect: { id: value.quizExplainMoreParams },
            };
            value.customStoryParams = {
                connect: { id: value.customStoryParams },
            };
            value.continuePromptParams = {
                connect: { id: value.continuePromptParams },
            };
            value.IdleParams = {
                connect: { id: value.IdleParams },
            };
            value.dalleParams = {
                connect: { id: value.dalleParams },
            };
            value.quizPromptParams = {
                connect: { id: value.quizPromptParams },
            };
            value.contextParams = {
                connect: { id: value.contextParams },
            };
            value.emojisParams = {
                connect: { id: value.emojisParams },
            };



            let result = await createDefaultPromptDB(value);
            if (!result) {
                console.error(e);
                Sentry.captureException(e);
                render(res, 500, statuscodes.INTERNAL_ERROR, {});
            }
            let defaultPrompt = await getDefaultPrompt(parseInt(result.id));

            render(res, 200, statuscodes.OK, defaultPrompt);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    editDefaultPrompt: async (req, res) => {
        try {
            const schema = Joi.object({
                name: Joi.string(),
                inUse: Joi.boolean(),
                language: Joi.number().integer().required(),
                minAge: Joi.number().integer().required(),
                maxAge: Joi.number().integer().required(),
                country: Joi.number().integer().required(),
                mainParams: Joi.number().integer().required(),
                explainMoreParams: Joi.number().integer().required(),
                spellMoreParams: Joi.number().integer().required(),
                funFactsParams: Joi.number().integer().required(),
                metadataParams: Joi.number().integer().required(),
                storyParams: Joi.number().integer().required(),
                quizParams: Joi.number().integer().required(),
                factParams: Joi.number().integer().required(),
                quizExplainMoreParams: Joi.number().integer().required(),
                customStoryParams: Joi.number().integer().required(),
                IdleParams: Joi.number().integer().required(),
                continuePromptParams: Joi.number().integer().required(),
                dalleParams: Joi.number().integer().required(),
                quizPromptParams: Joi.number().integer().required(),
                contextParams: Joi.number().integer().required(),
                emojisParams: Joi.number().integer().required(),
            });

            const { error, value } = schema.validate(req.body);
            if (error) {
                render(res, 400, statuscodes.VALIDATION_ERROR, error);
                return;
            }
            // this connects the existing entity
            value.country = {
                connect: { id: value.country },
            };
            value.language = {
                connect: { id: value.language },
            };
            value.mainParams = {
                connect: { id: value.mainParams },
            };
            value.explainMoreParams = {
                connect: { id: value.explainMoreParams },
            };
            value.spellMoreParams = {
                connect: { id: value.spellMoreParams },
            };
            value.funFactsParams = {
                connect: { id: value.funFactsParams },
            };
            value.metadataParams = {
                connect: { id: value.metadataParams },
            };
            value.storyParams = {
                connect: { id: value.storyParams },
            };
            value.quizParams = {
                connect: { id: value.quizParams },
            };
            value.factParams = {
                connect: { id: value.factParams },
            };
            value.quizExplainMoreParams = {
                connect: { id: value.quizExplainMoreParams },
            };
            value.customStoryParams = {
                connect: { id: value.customStoryParams },
            };
            value.IdleParams = {
                connect: { id: value.IdleParams },
            };
            value.continuePromptParams = {
                connect: { id: value.continuePromptParams },
            };
            value.dalleParams = {
                connect: { id: value.dalleParams },
            };
            value.quizPromptParams = {
                connect: { id: value.quizPromptParams },
            };
            value.contextParams = {
                connect: { id: value.contextParams },
            };
            value.emojisParams = {
                connect: { id: value.emojisParams },
            };

            let result = await editDefaultPromptDB(
                value,
                parseInt(req.params.id)
            );
            if (!result) {
                console.error(e);
                Sentry.captureException(e);
                render(res, 500, statuscodes.INTERNAL_ERROR, {});
            }
            let defaultPrompt = await getDefaultPrompt(parseInt(req.params.id));

            render(res, 200, statuscodes.OK, defaultPrompt);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    getDefaultPrompts: async (req, res) => {
        try {
            let paginationParameters = getPaginationParameters(req);
            let result = await getAllDefaultPrompts(paginationParameters);

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    deleteDefaultPrompt: async (req, res) => {
        try {
            let result = await deleteDefaultPromptDB(parseInt(req.params.id));

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    getDefaultPromptDetail: async (req, res) => {
        try {
            let result = await getDefaultPrompt(parseInt(req.params.id));

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
};

module.exports = adminDefaultPromptController;
