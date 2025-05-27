const render = require("../../helpers/render");
const statuscodes = require("../../helpers/statuscodes");
const Sentry = require("@sentry/node");
const {getPaginationParameters} = require("../../helpers/pagination");
const {getSessionsPaginated, getSessionDetail} = require("../../repositories/admin/session-repository");

const adminSessionController = {

    getSessions:  async (req, res) => {
        try {
            let paginationParameters = getPaginationParameters(req);
            let result = await getSessionsPaginated(parseInt(req.params.userId), paginationParameters)

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },

    getSessionDetail:  async (req, res) => {
        try {
            let result = await getSessionDetail(parseInt(req.params.sessionId))
            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },

}

module.exports = adminSessionController;