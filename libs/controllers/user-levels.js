const statuscodes = require('../helpers/statuscodes');
const Sentry = require("@sentry/node");
const render = require('../helpers/render');
const {getAll
} = require("../repositories/user-level-repository");
const logService = require('../service/logService');
const { LogType } = require('@prisma/client');

const userLevelsController = {

    getAllLevels: async (req, res) => {
        try {
            let levels = await getAll();

            await logService.createLog(req, { type : LogType.GET_LEVELS, message : `User with id : ${req.user.id} Get all Levels`})

            render(res, 200, statuscodes.OK, levels);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

}
module.exports = userLevelsController;


