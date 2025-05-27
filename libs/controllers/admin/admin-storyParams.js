const render = require("../../helpers/render");
const statuscodes = require("../../helpers/statuscodes");
const Sentry = require("@sentry/node");
const { getPaginationParameters } = require("../../helpers/pagination");
const {
    getAllParams,
    createStoryParams,
    fetchStoryParams,
    updateStoryParams,
    deleteStory,
    updateStoryParamTOS,
    getTosByParamId,
    updateStatusActivityParam,
} = require("../../repositories/admin/storyParams-repository");

const adminStoryParamsControllers = {
    getAllStoryParams: async (req, res) => {
        try {
            const pagination = getPaginationParameters(req);
            const storyParams = await fetchStoryParams(pagination);
            render(res, 200, statuscodes.OK, storyParams);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
    postNewParams: async (req, res) => {
        try {
            const { body } = req;
            const create = await createStoryParams(body);

            render(res, 201, statuscodes.OK, {});
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
    updateParams: async (req, res) => {
        try {
            const { id } = req.params;
            const { body } = req;
            const update = await updateStoryParams(parseInt(id), body);

            render(res, 200, statuscodes.OK, update);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
    deleteParams: async (req, res) => {
        try {
            const { id } = req.params;
            const update = await deleteStory(parseInt(id));

            render(res, 200, statuscodes.OK, {});
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
    getAllParamsByActivityId: async (req, res) => {
        try {
            const { id } = req.params;
            if (id == "null") {
                render(res, 200, statuscodes.OK, []);
                return;
            }
            const storyParams = await getAllParams(parseInt(id));

            render(res, 200, statuscodes.OK, storyParams);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
    updateStoryParamType: async (req, res) => {
        try {
            const { id } = req.params;
            const { body: data } = req;

            const result = await updateStoryParamTOS(id, data);

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
    getAllTypeOfStoryByParamId: async (req, res) => {
        try {
            const { id } = req.params;
            if (id == "null") {
                render(res, 200, statuscodes.OK, []);
                return;
            }
            const result = await getTosByParamId(parseInt(id));
            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
    updateActivityStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { body: data } = req;
            const result = await updateStatusActivityParam(parseInt(id), data);
            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
};

module.exports = adminStoryParamsControllers;
