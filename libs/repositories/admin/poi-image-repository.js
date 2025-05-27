const Sentry = require("@sentry/node");
const prisma = require("../../lib-prisma");

const poiImageRepository = {

    createPoiImageDB: async (data) => {
        try {
            let poi = await prisma.poiImage.create({
                data: data,
            });

            return poi;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    createPoiImages : async (data) => {
        try {
            let createPoi = await prisma.poiImage.create({
                data
            })
            return createPoi
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getPoiImages : async () => {
        try {
            const result = await prisma.poiImage.findMany()
            return result
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    updatePoiImages : async (id, data) => {
        try {
            const updatePoi = await prisma.poiImage.update({
                where : {
                    id
                },
                data
            })

            return updatePoi
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    deletePoiImages : async (id) => {
        try {
            const deletePoi = await prisma.poiImage.delete({
                where : {
                    id
                }
            })
            return deletePoi
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

}

module.exports = poiImageRepository;