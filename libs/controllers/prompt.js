const statuscodes = require('../helpers/statuscodes');
const Sentry = require("@sentry/node");
const render = require('../helpers/render');
const {getPaginationParameters} = require("../helpers/pagination");
const {getPromptsPaginated, searchPrompts, findPromptById, deletePromptById, reportPromptById} = require("../repositories/prompt-repository");
const logService = require('../service/logService');
const { LogType } = require('@prisma/client');

const promptController = {

    getPromptsPaginated: async (req, res) => {
        try {
            const { type = null } = req.query;
            let paginationParameters = getPaginationParameters(req);
            
            let result = await getPromptsPaginated(req.user.id, paginationParameters, type)

            await logService.createLog(req, { type : LogType.GET_PROMPTS, message: `Get all prompt with pagination by user with id : ${req.user.id}`})

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

    getPromptHistory: async (req, res) => {
        try {
            let result = await searchPrompts(req.user.id, req.body.query)
            
            await logService.createLog(req, { type : LogType.GET_PROMPTS_BY_QUERY})
            
            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

    deletePrompt: async (req, res) => {
        try {
            let prompt = await findPromptById(parseInt(req.params.id))
            if(!prompt){
                render(res, 400, statuscodes.NOT_FOUND, {});
                return;
            }else if(req.user.id !== prompt.session.userId){
                render(res, 400, statuscodes.NOT_ALLOWED, {});
                return;
            }

            let result = await deletePromptById(parseInt(req.params.id))
            if(!result){
                render(res, 400, statuscodes.INTERNAL_ERROR, {});
                return;
            }

            await logService.createLog(req, { type : LogType.DELETE_PROMPT, message : `Delete prompt with id : ${req.params.id} by User with id : ${req.user.id}`, promptId : req.params.id})

            render(res, 200, statuscodes.OK, null);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
    reportPrompt: async (req, res) => {
        try {
            let prompt = await findPromptById(parseInt(req.params.id))
            if(!prompt){
                render(res, 400, statuscodes.NOT_FOUND, {});
                return;
            }else if(req.user.id !== prompt.session.userId){
                render(res, 400, statuscodes.NOT_ALLOWED, {});
                return;
            }

            let result = await reportPromptById(parseInt(req.params.id))
            if(!result){
                render(res, 400, statuscodes.INTERNAL_ERROR, {});
                return;
            }
            await logService.createLog(req, { type : LogType.REPORT_PROMPT, message : `Report prompt with id : ${req.params.id} by User with id : ${req.user.id}`, promptId : parseInt(req.params.id)})

            render(res, 200, statuscodes.OK, null);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

}
module.exports = promptController;


