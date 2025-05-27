const statuscodes = require('../helpers/statuscodes');
const { LogType } = require("@prisma/client")
const Sentry = require("@sentry/node");
const render = require('../helpers/render');
const poisRepository = require("../repositories/pois-repository");
const logService = require("../service/logService");
const Joi = require("joi");
const { getAllPoiCategories } = require('../repositories/pois-category-repository');



const languageController = {

    getPoisBylocation: async (req, res) => {
        try {

            const schema = Joi.object({
                latitude: Joi.number().required(),
                longitude: Joi.number().required(),
                distance: Joi.number().optional(),
                limit: Joi.number().optional(),
                filter: Joi.array().items(Joi.number()).optional(),
                exclude: Joi.number()
            });

            const {error, value} = schema.validate(req.body);
            if (error) {
                render(res, 400, statuscodes.VALIDATION_ERROR, "latitude and longitude are required");
                return;
            }

            let pois = await poisRepository.getPoisFromCoordinates(value);
            await logService.createLog(req, {type: LogType.GET_POIS, message: `Get all points of interests by user with id : ${req.user.id}`});

            render(res, 200, statuscodes.OK, pois);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
    getAllPois: async (req, res) => {
        try {
            let pois = await poisRepository.getPois();
            await logService.createLog(req, {type: LogType.GET_POIS, message: `Get all points of interests by user with id : ${req.user.id}`});
            render(res, 200, statuscodes.OK, pois);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
    getAllPoisCategory : async (req, res) => {
        try {
            const categories = await getAllPoiCategories()
            render(res, 200, statuscodes.OK, categories)
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
    getSuggestions : async ( req, res ) => {
        try {
            const schema = Joi.object({
                categoryId: Joi.array().items(Joi.number()).optional(),
                name : Joi.string()
            });

            const {error, value} = schema.validate(req.body);
            if (error) {
                render(res, 400, statuscodes.VALIDATION_ERROR, 'Enter the value');
                return;
            }

            const suggestions = await poisRepository.getPoisSuggestions(value)
            render(res, 200, statuscodes.OK, suggestions)
        } catch (e) {
            console.error(e)
            Sentry.captureException(e)
            render(res, 500, statuscodes.INTERNAL_ERROR, {})
        }
    }
}
module.exports = languageController;


