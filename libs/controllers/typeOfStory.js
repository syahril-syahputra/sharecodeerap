const statuscodes = require("../helpers/statuscodes");
const Sentry = require("@sentry/node");
const render = require("../helpers/render");
const {
    getDetailType,
    getAllType,
    getRandomizedTypeOfStory,
} = require("../repositories/typeOfStory-repository");

module.exports = {
    getAllTypeOfStory: async (req, res) => {
        try {
            const typeOfStory = await getAllType();
            render(res, 200, statuscodes.OK, typeOfStory);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
    getTypeOfStoryById: async (req, res) => {
        try {
            const { id } = req.params;
            const typeOfStory = await getDetailType(
                parseInt(id),
                req.user.UserLevel
            );
            if (!typeOfStory) {
                render(res, 404, statuscodes.NOT_FOUND, {});
                return;
            }
            render(res, 200, statuscodes.OK, typeOfStory);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
    getRandomDataTOS: async (req, res) => {
        try {
            const result = await getRandomizedTypeOfStory(req.user.UserLevel);

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
};
