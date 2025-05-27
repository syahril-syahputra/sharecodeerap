const statuscodes = require('../helpers/statuscodes');
const Sentry = require("@sentry/node");
const render = require('../helpers/render');
const {getAll
} = require("../repositories/social-repository");
const logService = require('../service/logService');
const { LogType } = require('@prisma/client');

const socialController = {

    getAllSocial: async (req, res) => {
        try {
            let socials = await getAll();

            // await logService.createLog(req, { type : LogType.GET_SOCIALS, message: `User with id : ${req.user.id} Get all Social`})

            render(res, 200, statuscodes.OK, socials);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

}
module.exports = socialController;


