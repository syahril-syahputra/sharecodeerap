const Sentry = require("@sentry/node");
const prisma = require("../lib-prisma");

const PoiCategoryRepository = {

    getAllPoiCategories : async () => {
        try {
            const result = await prisma.poiCategory.findMany()
            return result
        } catch (e) {
            console.error(e)
            Sentry.captureException(e)
        }
    }


}

module.exports = PoiCategoryRepository