const render = require("../../helpers/render");
const statuscodes = require("../../helpers/statuscodes");
const Sentry = require("@sentry/node");
const {getPaginationParameters} = require("../../helpers/pagination");
const {getAllLanguages,  deleteLanguageDB, createLanguageDB, editLanguageDB} = require("../../repositories/admin/language-repository");

const adminLanguageController = {
    createLanguage:  async (req, res) => {
        try {
            let result = await createLanguageDB(req.body)

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    editLanguage:  async (req, res) => {
        try {
            let result = await editLanguageDB(req.body, parseInt(req.params.id))

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    getLanguages:  async (req, res) => {
        try {
            let paginationParameters = getPaginationParameters(req);
            let result = await getAllLanguages(paginationParameters)

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    deleteLanguage:  async (req, res) => {
        try {
            let result = await deleteLanguageDB(parseInt(req.params.id));

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
}

module.exports = adminLanguageController;