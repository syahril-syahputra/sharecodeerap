const render = require("../../helpers/render");
const statuscodes = require("../../helpers/statuscodes");
const Sentry = require("@sentry/node");
const {getPaginationParameters} = require("../../helpers/pagination");
const {
    getAllPois,
    deletePoiDB,
    createPoiDB,
    editPoiDB,
    validatePoiDB,
    invalidatePoiDB
} = require("../../repositories/admin/poi-repository");
const generatePointsForCountry = require("../../../commands/maps/generatePois");
const axios = require("axios");

const adminPoiController = {
    createPoi: async (req, res) => {
        try {
            let result = await createPoiDB(req.body)

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    editPoi: async (req, res) => {
        try {
            let result = await editPoiDB(req.body, parseInt(req.params.id))
            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    getPois: async (req, res) => {
        try {
            let paginationParameters = getPaginationParameters(req);
            let result = await getAllPois(paginationParameters, req.query.category, req.query.country, req.query.search);

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },

    deletePoi: async (req, res) => {
        try {
            let result = await deletePoiDB(parseInt(req.params.id));

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },

    generatePois: async (req, res) => {

        try {

            let poisPerRequest = 5;
            let numberOfPois = req.body.numberOfPois;
            let listOfCountries = req.body.countries;
            let listOfCategories = req.body.categories;
            let prompt = req.body.prompt;
            let region = req.body.region;

            const promises = [];
            for (const countryId of listOfCountries) {
                promises.push(generatePointsForCountry(numberOfPois, poisPerRequest, countryId, region, listOfCategories, prompt));
            }

            const results = await Promise.all(promises);

            render(res, 200, statuscodes.OK, "ok");
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },

    validatePoi: async (req, res) => {

        try {
            let result = await validatePoiDB(req.user.id, parseInt(req.params.id))
            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },

    invalidatePoi: async (req, res) => {

        try {
            let result = await invalidatePoiDB(req.user.id, parseInt(req.params.id))
            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },

    geocode: async (req, res) => {

        try {
            const apiKey = process.env.GOOGLE_MAPS_SECRET;
            const apiUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
                req.body.name
            )}&key=${apiKey}`;

            const response = await axios.get(apiUrl);
            const data = response.data;

            console.log(data)

            if (data.status !== 'OK') {
                render(res, 200, statuscodes.INTERNAL_ERROR, "Geocode failed");
            }

            const location = data.results[0].geometry.location;
            render(res, 200, statuscodes.OK, {
                latitude: location.lat,
                longitude: location.lng,
            });

        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
}

module.exports = adminPoiController;