const statuscodes = require('../helpers/statuscodes');
const { LogType } = require("@prisma/client")
const Sentry = require("@sentry/node");
const render = require('../helpers/render');
const {getLanguages
} = require("../repositories/language-repository");
const logService = require("../service/logService");

const languageController = {

    getAllLanguages: async (req, res) => {
        try {
            let languages = await getLanguages();

            // await logService.createLog(req, {type: LogType.GET_LANGUAGES, message: `Get all language by user with id : ${req.user.id}`});

            render(res, 200, statuscodes.OK, languages);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

}
module.exports = languageController;


