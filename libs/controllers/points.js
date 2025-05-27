const statuscodes = require('../helpers/statuscodes');
const { LogType } = require("@prisma/client")
const Sentry = require("@sentry/node");
const render = require('../helpers/render');
const {
    getCurrentPoint,
    updateUserPoint
} = require("../repositories/point-repository");
const logService = require("../service/logService");
const Joi = require('joi');
const userLevelsService = require('../service/userLevelsService');

const pointController = {
    getPoint : async (req, res) => {
        try {
            let point = await getCurrentPoint(req.user.id)

            render(res, 200, statuscodes.OK, point)
        } catch (e) {
            console.error(e)
            Sentry.captureException(e)
            render(res, 500, statuscodes.INTERNAL_ERROR, {})
        }
    },
    updatePoint : async (req, res) => {
        try {
            const schema = Joi.object({
                points : Joi.number()
            })

            const { error, value} = schema.validate(req.body)

            if (error) {
                render(res, 400, statuscodes.VALIDATION_ERROR, error);
                return;
            }

            
            let points = await updateUserPoint(req.user.id, value.points)
            let updateUserLevel = await userLevelsService.updateUserLevel(req.user)
            render(res, 200, statuscodes.OK, { points : points.points,...updateUserLevel })
        } catch (e) {
            console.error(e)
            Sentry.captureException(e)
            render(res, 500, statuscodes.INTERNAL_ERROR, {})
        }
    },
}

module.exports = pointController