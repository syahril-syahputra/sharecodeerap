const statuscodes = require('../helpers/statuscodes');
const { LogType } = require("@prisma/client")
const Sentry = require("@sentry/node");
const render = require('../helpers/render');
const SettingsRepository = require("../repositories/settings-repository");

const settingsController = {

    getAllSettings: async (req, res) => {
        try {
            let settings = await SettingsRepository.getSettings()

            render(res, 200, statuscodes.OK, settings);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

}
module.exports = settingsController;


