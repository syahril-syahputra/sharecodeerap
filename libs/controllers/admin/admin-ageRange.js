const render = require("../../helpers/render");
const statuscodes = require("../../helpers/statuscodes");
const Sentry = require("@sentry/node");
const { getAllAgeRange, createAgeRange, editAgeRange, deleteAgeRange } = require("../../repositories/admin/ageRange");

const ageRangeControllers = {
    getAgeRangeGroup : async (req, res) => {
        try {
            const result = await getAllAgeRange()

            render(res, 200, statuscodes.OK, result)
        } catch (e) {
            render(res, 500, statuscodes.INTERNAL_ERROR, {})
            Sentry.captureException(e)
            console.error(e)
        }
    },
    createAgeRange : async (req, res) => {
        try {
            const result = await createAgeRange(req.body)

            render(res, 201, statuscodes.OK, result)
        } catch (e) {
            console.error(e)
            render(res, 500, statuscodes.INTERNAL_ERROR, {})
            Sentry.captureException(e)
        }
    },
    updateAgeRange : async (req, res ) => {
        try {
            const { id } = req.params
            const update = await editAgeRange(parseInt(id), req.body)
            render(res, 200, statuscodes.OK, update)
        } catch (e) {
            console.error(e)
            render(res, 500, statuscodes.INTERNAL_ERROR, {})
            Sentry.captureException(e)
        }
    },
    deleteAgeRange : async (req, res) => {
        try {
        const { id } = req.params
        const result = await deleteAgeRange(parseInt(id))
        render(res, 200, statuscodes.OK, result)            
        } catch (e) {
            console.error(e)
            render(res, 500, statuscodes.INTERNAL_ERROR, {})
            Sentry.captureException(e)
        }
    }

}

module.exports = ageRangeControllers