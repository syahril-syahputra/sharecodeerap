const Sentry = require("@sentry/node");
const prisma = require("../../lib-prisma");

const topicRepository = {
    createTopicDB: async (data) => {
        try {
            let topic = await prisma.topic.create({
                data: data,
            });

            return topic;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    editTopicDB: async (data, topicId) => {
        try {
            let topic = await prisma.topic.update({
                where: {
                    id: topicId,
                },
                data: data,
            });

            return topic;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getAllTopics: async (paginationParameters) => {
        try {
            const topics = await prisma.topic.findMany({
                include: {
                    UserLevel: true,
                },
                ...paginationParameters,
            });
            const numTopics = await prisma.topic.count();

            return {
                topics: topics,
                pagination: { ...paginationParameters, total: numTopics },
            };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    deleteTopicDB: async (topicId) => {
        try {
            const topic = await prisma.topic.delete({
                where: {
                    id: topicId,
                },
            });

            return topic;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getOneTopic: async (id) => {
        try {
            const topic = await prisma.topic.findFirst({
                where: {
                    id,
                },
            });

            return topic;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
};

module.exports = topicRepository;
