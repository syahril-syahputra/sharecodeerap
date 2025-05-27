const render = require("../../helpers/render");
const statuscodes = require("../../helpers/statuscodes");
const Sentry = require("@sentry/node");
const {getUserDetail, deleteUserDB, setVerifiedDB, updateLevelUser, updateUserPoint, findUserWithPrompts} = require("../../repositories/admin/user-repository");
const gptService = require("../../service/gptService");

const adminUserController = {
    getUserDetail:  async (req, res) => {
        try {
            let result = await getUserDetail(parseInt(req.params.id));
            // console.log(result)
            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    deleteUser:  async (req, res) => {
        try {
            let result = await deleteUserDB(parseInt(req.params.id));

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    setVerified:  async (req, res) => {
        try {
            let result = await setVerifiedDB(parseInt(req.params.id), req.body.verified);

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    updateLevel:  async (req, res) => {
        try {
            let result = await updateLevelUser(parseInt(req.params.id), req.body.userLevelId);

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    updatePoints:  async (req, res) => {
        try {
            let result = await updateUserPoint(parseInt(req.params.id), req.body.points);

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    generateInterests:  async (req, res) => {
        try {

            let user = await findUserWithPrompts(parseInt(req.params.id));

            for (const session of user.Session) {
                await gptService.processSessionPrompt(session);
            }

            render(res, 200, statuscodes.OK, "ok");
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
}

module.exports = adminUserController;