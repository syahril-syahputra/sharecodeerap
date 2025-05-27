const Sentry = require("@sentry/node");
const prisma = require("../../lib-prisma");

const poiLocationRepository = {
    createPoiLocationDB: async (data) => {
        try {
            let poiLocation = await prisma.poiLocation.create({
                data: data,
            });

            return poiLocation;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    editPoiLocationDB: async (data, poiLocationId) => {
        try {
            let poiLocation = await prisma.poiLocation.update({
                where: {
                  id: poiLocationId
                },
                data
            });
            return poiLocation;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getAllPoiLocations: async (paginationParameters) => {
        try {
            const poiLocations = await prisma.poiLocation.findMany({
                ...paginationParameters
            });

            const numPoiLocations = await prisma.poiLocation.count();

            return {poiLocations: poiLocations, pagination: {...paginationParameters, total: numPoiLocations}};
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    deletePoiLocationDB: async (poiLocationId) => {
        try {
            const poiLocation = await prisma.poiLocation.delete({
                where: {
                    id: poiLocationId,
                }
            });

            return poiLocation;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
}

module.exports = poiLocationRepository;