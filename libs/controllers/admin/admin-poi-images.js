const render = require("../../helpers/render");
const statuscodes = require("../../helpers/statuscodes");
const Sentry = require("@sentry/node");
const { createPoiImages, deletePoiImages, getPoiImages, updatePoiImages } = require("../../repositories/admin/poi-image-repository");


const adminPoiImageController = {
    getImages : async (req, res) => {
        try {
            const result = await getPoiImages()
            render(res, 200, statuscodes.OK, result)
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    createImages : async (req, res) => {
        try {
            const { body } = req
            const result = await createPoiImages(body)
            render(res, 201, statuscodes.OK, result)
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    updateImages : async (req, res) => {
        try {
            const { id } = req.params
            const { body:data } = req
            const result = await updatePoiImages(parseInt(id), data)
            render(res, 200, statuscodes.OK, result)
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    deleteImages : async (req, res) => {
        try {
            const { id } = req.params
            const resultDelete = await deletePoiImages(parseInt(id))
            render(res, 200, statuscodes.OK, {})
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
}

module.exports = adminPoiImageController