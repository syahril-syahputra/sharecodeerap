const Sentry = require("@sentry/node");
const prisma = require("../lib-prisma");

const activityRepository = {

    getAllActivities: async () => {
        try {
            const activities = await prisma.activity.findMany();
            return activities;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    getActivitiesPaginated: async (paginationParameters) => {
        try {
            const activities = await prisma.activity.findMany({
                ...paginationParameters,
                orderBy: [
                    {
                        id: 'asc',
                    }
                ],
                include: {
                    Topic: true
                }
            });

            const numActivities = await prisma.activity.count();

            return {activities: activities, pagination: {...paginationParameters, total: numActivities}};
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
}

module.exports = activityRepository;