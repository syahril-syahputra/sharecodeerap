const render = require("../../helpers/render");
const statuscodes = require("../../helpers/statuscodes");
const Sentry = require("@sentry/node");
const {getPaginationParameters} = require("../../helpers/pagination");
const {getAllPoiLocations,  deletePoiLocationDB, createPoiLocationDB, editPoiLocationDB} = require("../../repositories/admin/poi-location-repository");

const adminPoiLocationController = {
    createPoiLocation:  async (req, res) => {
        try {
            let result = await createPoiLocationDB(req.body)

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    editPoiLocation:  async (req, res) => {
        try {
            let result = await editPoiLocationDB(req.body, parseInt(req.params.id))
            console.log(result, 'result')
            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    getPoiLocations:  async (req, res) => {
        try {
            let paginationParameters = getPaginationParameters(req);
            let result = await getAllPoiLocations(paginationParameters)

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    deletePoiLocation:  async (req, res) => {
        try {
            let result = await deletePoiLocationDB(parseInt(req.params.id));

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
}

module.exports = adminPoiLocationController;