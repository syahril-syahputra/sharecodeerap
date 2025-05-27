const Sentry = require("@sentry/node");
const prisma = require("../../lib-prisma");

const poiRepository = {
    createPoiDB: async (data) => {
        try {
            let poi = await prisma.poi.create({
                data: data,
            });

            return poi;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    editPoiDB: async (data, poiId) => {
        try {
            let poi = await prisma.poi.update({
                where: {
                  id: poiId
                },
                data
            });
            return poi;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getAllPois: async (paginationParameters, category, country, search) => {
        try {

            let query = {
                include: {
                    Country: true,
                    Category: true,
                    validatedBy: true,
                },
                orderBy: [
                    {
                        id: 'desc',
                    },
                ],
                ...paginationParameters
            };
            let countQuery = {};

            if (category) {
                query.where = {
                    categoryId: parseInt(category)
                }
                countQuery.where = {
                    categoryId: parseInt(category)
                }
            }

            if (country) {
                query.where = {
                    ...query.where,
                    countryId: parseInt(country)
                }
                countQuery.where = {
                    ...countQuery.where,
                    countryId: parseInt(country)
                }
            }

            if (search && search !== '') {
                query.where = {
                    ...query.where,
                    name: {
                        contains: search
                    }
                }
                countQuery.where = {
                    ...countQuery.where,
                    name: {
                        contains: search
                    }
                }
            }

            const pois = await prisma.poi.findMany(query);
            const numPois = await prisma.poi.count(countQuery);

            return {pois: pois, pagination: {...paginationParameters, total: numPois}};
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    deletePoiDB: async (poiId) => {
        try {
            const poi = await prisma.poi.delete({
                where: {
                    id: poiId,
                }
            });

            return poi;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    insertPois: async (pois, country) => {

        for (const poi of pois) {

            let isRepeated = await prisma.poi.findFirst({
                where:{
                    name: poi.name
                }
            });
            if(isRepeated){
                continue;
            }

            // console.log(poi)
            let poiData = {
                name: poi.name,
                latitude: poi.latitude,
                longitude: poi.longitude,
                description: poi.description,
                categoryId: poi.category,
                countryId: country.id,
                generatedAt: new Date(),
            }

            let mainPoi = await prisma.poi.create({
                data: poiData
            });
            // console.log(mainPoi)
            //
            // for (const related of poi.relateds) {
            //
            //     let poiRelated = {
            //         name: related.name,
            //         latitude: related.latitude,
            //         longitude: related.longitude,
            //         description: related.description,
            //         categoryId: related.category,
            //         poiId: mainPoi.id
            //     }
            //
            //     let result = await prisma.poiRelated.create({
            //         data: poiRelated
            //     });
            // }
        }
    },

    validatePoiDB: async (userId, poiId) => {
        try {
            let poi = await prisma.poi.update({
                where: {
                    id: poiId
                },
                data: {
                    validatedById: parseInt(userId),
                    validatedAt: new Date()
                }
            });
            return poi;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    invalidatePoiDB: async (userId, poiId) => {
        try {
            let poi = await prisma.poi.update({
                where: {
                    id: poiId
                },
                data: {
                    validatedById: null,
                    validatedAt: null
                }
            });
            return poi;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
}

module.exports = poiRepository;