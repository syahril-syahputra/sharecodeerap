const statuscodes = require("../helpers/statuscodes");
const Sentry = require("@sentry/node");
const render = require("../helpers/render");
const logService = require("../service/logService");
const { LogType } = require("@prisma/client");
const {
    getAll,
    getTopicByStoryParams,
} = require("../repositories/storyParams-repository");

const storyParamsController = {
    getAllParams: async (req, res) => {
        try {
            const storyParams = await getAll();
            render(res, 200, statuscodes.OK, storyParams);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
    getDetailParamsById: async (req, res) => {
        try {
            const { id } = req.params;
            const topics = await getTopicByStoryParams(parseInt(id), req.user.UserLevel);
            render(res, 200, statuscodes.OK, topics);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
};

module.exports = storyParamsController;
