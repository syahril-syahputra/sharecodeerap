const Sentry = require("@sentry/node");
const prisma = require("../lib-prisma");

const poiRepository = {
    getPois: async () => {
        try {
            const pois = await prisma.poi.findMany({
                include: {
                    Category: true,
                    Country: true,
                },
            });
            return pois;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    getPoisFromCoordinates: async ({
        latitude,
        longitude,
        distance,
        limit,
        filter,
        exclude,
    }) => {
        try {
            let d = distance ?? 1000;
            let l = limit ?? 20;
            const elementExclude = exclude ? `AND id NOT in (${exclude})` : "";
            const filterIds =
                filter && filter.length >= 1 ? filter.join(",") : "";
            const filterClause = filterIds
                ? `AND categoryId IN (${filterIds})`
                : "";
            let query = `SELECT
            *
        FROM
            (SELECT
                Poi.*,
                PoiCategory.name AS categoryName,
                PoiCategory.imageUrl AS categoryIcon,
                Country.name AS countryName,
                Country.imageUrl AS countryIcon,
                ST_Distance_Sphere(point(${longitude}, ${latitude}), point(Poi.longitude, Poi.latitude)) / 1000 AS distance
            FROM
                Poi
            INNER JOIN PoiCategory ON PoiCategory.id = Poi.categoryId
            INNER JOIN Country ON Country.id = Poi.countryId) AS points
        WHERE
            distance < ${d}
            ${filterClause} 
            ${elementExclude}
        ORDER BY
            distance
        LIMIT ${l};`;


            const result = await prisma.$queryRawUnsafe(query);
            let resObj;
        
        
            if (!result) {
                return 0;
            } else {
                resObj = result.map((val) => {
                    const obj = { ...val };
                    if (val.categoryId) {
                        obj.Category = {
                            id: val.categoryId,
                            name: val.categoryName,
                            imageUrl: val.categoryIcon,
                        };
                    }

                    if (val.countryId) {
                        obj.Country = {
                            id: val.countryId,
                            name: val.countryName,
                            imageUrl: val.countryIcon,
                        };
                    }

                    delete obj.categoryId;
                    delete obj.categoryName;
                    delete obj.categoryIcon;
                    delete obj.countryId;
                    delete obj.countryIcon;
                    delete obj.countryName;

                    return obj
                });
            }
            return resObj;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    getPoisById: async (poiId) => {
        try {
            const poi = await prisma.poi.findFirst({
                where: {
                    id: poiId,
                },
            });

            return poi;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    poiExists: async (poiId) => {
        try {
            const count = await prisma.poi.count({
                where: {
                    id: poiId,
                },
            });

            return count > 0;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getPoisSuggestions: async ({ catergoryId, name }) => {
        try {
            const suggest = await prisma.poi.findMany({
                where: {
                    name: {
                        contains: name,
                    },
                    categoryId: {
                        in: catergoryId,
                    },
                },
                include : {
                    Category : true,
                    Country : true
                }
            });

            return suggest;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
};

module.exports = poiRepository;
