const render = require("../../helpers/render");
const statuscodes = require("../../helpers/statuscodes");
const Sentry = require("@sentry/node");
const { getPaginationParameters } = require("../../helpers/pagination");
const {
    getAllTos,
    createTos,
    updateTos,
} = require("../../repositories/admin/typeOfStory-repository");

module.exports = {
    getAllTypeOfStory: async (req, res) => {
        try {
            const pagination = getPaginationParameters(req);
            const typeOfStories = await getAllTos(pagination);

            render(res, 200, statuscodes.OK, typeOfStories);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
    createTypeOfStory: async (req, res) => {
        try {
            const { body: data } = req;
            const typeOfStory = await createTos({
                ...data,
                createdBy: req.user.id,
            });
            render(res, 201, statuscodes.OK, typeOfStory);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
    updateTypeOfStory: async (req, res) => {
        try {
            const { id } = req.params;
            const { body: data } = req;

            const update = await updateTos(parseInt(id), data);

            render(res, 200, statuscodes.OK, update);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.OK, {});
        }
    },
};
