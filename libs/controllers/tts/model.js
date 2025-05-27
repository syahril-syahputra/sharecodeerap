const Sentry = require("@sentry/node");
const render = require("../../helpers/render");
const statuscodes = require("../../helpers/statuscodes");
const { getAvailableModels } = require("../../service/elevenLabService");

const modelController = {
    getElevanLabsModel: async (req, res) => {
        try {
            let models = await getAvailableModels();
            render(res, 200, statuscodes.OK, models);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
};

module.exports = modelController;
