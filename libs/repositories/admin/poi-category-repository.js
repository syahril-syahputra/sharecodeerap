const Sentry = require("@sentry/node");
const prisma = require("../../lib-prisma");

const poiCategoryRepository = {
    createPoiCategoryDB: async (data) => {
        try {
            let poiCategory = await prisma.poiCategory.create({
                data: data,
            });

            return poiCategory;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    editPoiCategoryDB: async (data, poiCategoryId) => {
        try {
            let poiCategory = await prisma.poiCategory.update({
                where: {
                  id: poiCategoryId
                },
                data
            });
            return poiCategory;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getAllPoiCategories: async (paginationParameters) => {
        try {
            const poiCategories = await prisma.poiCategory.findMany({
                ...paginationParameters
            });

            const numPoiCategories = await prisma.poiCategory.count();

            return {poiCategories: poiCategories, pagination: {...paginationParameters, total: numPoiCategories}};
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    deletePoiCategoryDB: async (poiCategoryId) => {
        try {
            const poiCategory = await prisma.poiCategory.delete({
                where: {
                    id: poiCategoryId,
                }
            });

            return poiCategory;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
}

module.exports = poiCategoryRepository;