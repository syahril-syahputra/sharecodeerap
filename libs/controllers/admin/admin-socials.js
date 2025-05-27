const render = require("../../helpers/render");
const statuscodes = require("../../helpers/statuscodes");
const Sentry = require("@sentry/node");
const {getPaginationParameters} = require("../../helpers/pagination");
const {getAllSocials,  deleteSocialDB, createSocialDB, editSocialDB} = require("../../repositories/admin/social-repository");

const adminSocialController = {
    createSocial:  async (req, res) => {
        try {
            let result = await createSocialDB(req.body)

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    editSocial:  async (req, res) => {
        try {
            let result = await editSocialDB(req.body, parseInt(req.params.id))

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    getSocials:  async (req, res) => {
        try {
            let paginationParameters = getPaginationParameters(req);
            let result = await getAllSocials(paginationParameters)

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    deleteSocial:  async (req, res) => {
        try {
            let result = await deleteSocialDB(parseInt(req.params.id));

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
}

module.exports = adminSocialController;