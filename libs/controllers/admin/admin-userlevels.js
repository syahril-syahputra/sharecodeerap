const render = require("../../helpers/render");
const statuscodes = require("../../helpers/statuscodes");
const Sentry = require("@sentry/node");
const {getPaginationParameters} = require("../../helpers/pagination");
const {getAllUserLevels,  deleteUserLevelDB, createUserLevelDB, editUserLevelDB} = require("../../repositories/admin/userlevel-repository");

const adminUserLevelController = {
    createUserLevel:  async (req, res) => {
        try {
            let result = await createUserLevelDB(req.body)

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    editUserLevel:  async (req, res) => {
        try {
            let result = await editUserLevelDB(req.body, parseInt(req.params.id))

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    getUserLevels:  async (req, res) => {
        try {
            let paginationParameters = getPaginationParameters(req);
            let result = await getAllUserLevels(paginationParameters)

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    deleteUserLevel:  async (req, res) => {
        try {
            let result = await deleteUserLevelDB(parseInt(req.params.id));

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
}

module.exports = adminUserLevelController;