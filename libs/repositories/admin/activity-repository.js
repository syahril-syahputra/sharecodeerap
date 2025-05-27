const Sentry = require("@sentry/node");
const prisma = require("../../lib-prisma");

const activityRepository = {
    createActivityDB: async (data) => {
        try {
            let activity = await prisma.activity.create({
                data: data,
            });

            return activity;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    editActivityDB: async (data, activityId) => {
        console.log(data)
        try {
            let activity = await prisma.activity.update({
                where: {
                    id: activityId,
                },
                data: data,
            });

            return activity;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getAllActivities: async (paginationParameters) => {
        try {
            const result = await prisma.activity.findMany({
                ...paginationParameters,
                orderBy: [
                    {
                        id: "asc",
                    },
                ],
                include: {
                    StoryParamsActivity: {
                        where: {
                            active: true,
                        },
                        include: {
                            StoryParam: true,
                        },
                    },
                    UserLevel : true
                },
            });
            const activities = result.map((e) => {
                let data = {
                    ...e,
                    StoryParams: e.StoryParamsActivity.length
                        ? e.StoryParamsActivity.map((e) => e.StoryParam)
                        : null,
                };
                delete data.StoryParamsActivity;
                return data;
            });

            const numActivities = await prisma.activity.count();

            return {
                activities,
                pagination: { ...paginationParameters, total: numActivities },
            };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getTopicActivityById: async (activityId, paginationParameters) => {
        try {
            const topics = await prisma.topic.findMany({
                ...paginationParameters,
                where: {
                    activityId: activityId,
                },
                orderBy: [
                    {
                        id: "asc",
                    },
                ],
            });

            const numTopics = await prisma.topic.count({
                where: {
                    activityId: activityId,
                },
            });

            return {
                topics: topics,
                pagination: { ...paginationParameters, total: numTopics },
            };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    deleteActivityDB: async (activityId) => {
        try {
            const activity = await prisma.activity.delete({
                where: {
                    id: activityId,
                },
            });

            return activity;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getOneActivity : async (id) => {
        try {
            const act = await prisma.activity.findFirst({
                where : {
                    id
                }
            })

            return act
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    }
};

module.exports = activityRepository;
