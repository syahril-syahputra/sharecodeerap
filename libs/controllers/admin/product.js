const statuscodes = require("../../helpers/statuscodes");
const { LogType } = require("@prisma/client");
const Sentry = require("@sentry/node");
const render = require("../../helpers/render");
const {
    getAllProducts,
    getAllPlan,
    getFieldsType,
    postNewPlan,
    putPlan,
    deletePlan,
} = require("../../repositories/product-repository");

const productController = {
    getProducts: async (req, res) => {
        try {
            let products = await getAllProducts();

            render(res, 200, statuscodes.OK, products);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
    getPlan: async (req, res) => {
        try {
            let data = await getAllPlan();

            render(res, 200, statuscodes.OK, data);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
    getPlanField: async (req, res) => {
        try {
            let result = await getFieldsType();

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
    createNewPlan: async (req, res) => {
        try {
            const { body: data } = req;
            const result = await postNewPlan(data);

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
    editPlan: async (req, res) => {
        try {
            const { body: data } = req;
            const { id } = req.params;
            const result = await putPlan(parseInt(id), data);

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
    destroyPlan: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await deletePlan(parseInt(id));

            render(
                res,
                result ? 200 : 401,
                result ? statuscodes.OK : statuscodes.BAD_REQUEST,
                result ? result : {}
            );
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
};
module.exports = productController;
