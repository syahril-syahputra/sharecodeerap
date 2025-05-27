const Sentry = require("@sentry/node");
const prisma = require("../lib-prisma");

const topicRepository = {

    findOneById: async (topicId) => {
        try {
            const topics = await prisma.topic.findFirst({
                where: {
                    id: topicId,
                },
            });
            return topics;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    getAllTopics: async (activityId) => {
        try {
            const topics = await prisma.topic.findMany({
                where: {
                    activityId: activityId,
                },
            });
            return topics;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    getTopicsPaginated: async (paginationParameters) => {
        try {
            const topics = await prisma.topic.findMany({
                ...paginationParameters,
                orderBy: [
                    {
                        id: 'asc',
                    }
                ],
            });

            const numTopics = await prisma.topic.count();

            return {topics: topics, pagination: {...paginationParameters, total: numTopics}};
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getAllRandomizeTopic : async (paginationParameters, id) => {
        try {
            const topics = await prisma.$queryRawUnsafe(
                `SELECT * FROM Topic ORDER BY RAND() LIMIT ${paginationParameters.take} OFFSET ${paginationParameters.skip}`
                )
            const numTopics = await prisma.topic.count()
            if(id.length > 0) {
                const idStr = id.join(',')
                const topics2 = await prisma.$queryRawUnsafe(
                    `SELECT * FROM Topic WHERE id NOT IN (${idStr}) ORDER BY RAND() LIMIT ${paginationParameters.take} OFFSET ${paginationParameters.skip}`
                )  
                return { topics : topics2, pagination : {...paginationParameters, total : numTopics - id.length}}
            } else {
                return {topics : topics, pagination : {...paginationParameters, total : numTopics}};
            }
        } catch (e) {
            console.error(e);
            console.log(e)
            Sentry.captureException(e);
        }
    },

    topicsByIds: async (topicIds) => {
        try {
            const result = await prisma.topic.findMany({
                where: {
                    id: {
                        in: topicIds,
                    },
                },
            });

            return result;

        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
}

module.exports = topicRepository;