const render = require("../../helpers/render");
const statuscodes = require("../../helpers/statuscodes");
const Sentry = require("@sentry/node");
const {getPaginationParameters} = require("../../helpers/pagination");
const {getPromptsPaginated, getPromptDetail, getFactsPaginated, getStoriesPaginated, getQuizExplainMoreDB} = require("../../repositories/admin/prompt-repository");
const promptRepository = require("../../repositories/admin/prompt-repository");
const { PromptType } = require("@prisma/client");

const adminPromptController = {

    getPrompts:  async (req, res) => {
        try {
            let paginationParameters = getPaginationParameters(req);
            let result = await getPromptsPaginated(parseInt(req.params.sessionId), paginationParameters)

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    getUserFactPrompts:  async (req, res) => {
        try {
            let paginationParameters = getPaginationParameters(req);
            let result = await getFactsPaginated(parseInt(req.params.userId), paginationParameters, req.query.search)

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    getUserStoryPrompts:  async (req, res) => {
        try {
            let paginationParameters = getPaginationParameters(req);
            let result = await getStoriesPaginated(parseInt(req.params.userId), paginationParameters, req.query.search)

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    getQuizExplainMorePrompts:  async (req, res) => {
        try {
            let paginationParameters = getPaginationParameters(req);
            let result = await getQuizExplainMoreDB(parseInt(req.params.userId), paginationParameters, req.query.search)

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    getPromptsAssistant:  async (req, res) => {
        try {
            let paginationParameters = getPaginationParameters(req);
            let result = await promptRepository.getPromptsAssistantPaginated(parseInt(req.params.userId), paginationParameters)

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    getDallePrompt: async (req,res) => {
        try {
            let paginationParameters = getPaginationParameters(req);
            let result = await promptRepository.getDallePromptPaginated(parseInt(req.params.userId), paginationParameters, req.query.search)
            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR);
        }
    }
}

module.exports = adminPromptController;