const render = require("../../helpers/render");
const statuscodes = require("../../helpers/statuscodes");
const Sentry = require("@sentry/node");
const SystemPromptsRepository = require("../../repositories/admin/system-prompt-repository");

const adminSystemPromptController = {
    editSystemPrompt:  async (req, res) => {
        try {
            let result = await SystemPromptsRepository.editSystemPromptDB(req.body, parseInt(req.params.id))

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    getSystemPrompts:  async (req, res) => {
        try {
            let result = await SystemPromptsRepository.getAllSystemPrompts()

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    getSystemPromptsDetail:  async (req, res) => {
        try {
            let result = await SystemPromptsRepository.getSystemPromptsById(parseInt(req.params.id))

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
}

module.exports = adminSystemPromptController;