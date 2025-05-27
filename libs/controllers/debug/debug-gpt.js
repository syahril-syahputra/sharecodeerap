const render = require("../../helpers/render");
const statuscodes = require("../../helpers/statuscodes");
const Sentry = require("@sentry/node");
const {getSessionDetailWithPrompts} = require("../../repositories/admin/session-repository");
const sessionRepository = require("../../repositories/session-repository");
const promptService = require("../../service/promptService");

const adminLanguageController = {
    getSessionDetail:  async (req, res) => {
        try {
            let session = await getSessionDetailWithPrompts(parseInt(req.params.sessionId));
            let engine = session.DefaultPrompt?.mainParams?.Engine;
            let lastProcessPrompt = await sessionRepository.getLastProcessedPrompt(req.user.id);
            let assembledPrompt = null;
            let assembledChatGptPrompt = null;

            if(engine.model === "gpt-3.5-turbo"){
                assembledChatGptPrompt = await promptService.assembleChatGPTPrompt(session, lastProcessPrompt, "");
            }else{
                assembledPrompt = promptService.assemblePrompt(session, lastProcessPrompt, "");
            }
            delete session.Prompts;

            render(res, 200, statuscodes.OK, {
                session: session,
                sessionPrompt: assembledPrompt,
                chatGPTsessionPrompt: assembledChatGptPrompt
            });
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
}

module.exports = adminLanguageController;