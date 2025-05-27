const render = require("../../helpers/render");
const statuscodes = require("../../helpers/statuscodes");
const Sentry = require("@sentry/node");
const {getPaginationParameters} = require("../../helpers/pagination");
const {getAllPoiCategories,  deletePoiCategoryDB, createPoiCategoryDB, editPoiCategoryDB} = require("../../repositories/admin/poi-category-repository");

const adminPoiCategoryController = {
    createPoiCategory:  async (req, res) => {
        try {
            let result = await createPoiCategoryDB(req.body)

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    editPoiCategory:  async (req, res) => {
        try {
            let result = await editPoiCategoryDB(req.body, parseInt(req.params.id))
            console.log(result, 'result')
            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    getPoiCategories:  async (req, res) => {
        try {
            let paginationParameters = getPaginationParameters(req);
            let result = await getAllPoiCategories(paginationParameters)

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    deletePoiCategory:  async (req, res) => {
        try {
            let result = await deletePoiCategoryDB(parseInt(req.params.id));

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
}

module.exports = adminPoiCategoryController;