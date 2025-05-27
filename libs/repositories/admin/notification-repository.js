const Sentry = require("@sentry/node");
const prisma = require("../../lib-prisma");

module.exports = {
    getAllNotifications: async (paginationParameters) => {
        try {
            const notifications = await prisma.notifications.findMany({
                ...paginationParameters,
            });

            const total = await prisma.notifications.count();

            return {
                notifications,
                pagination: {
                    ...paginationParameters,
                    total,
                },
            };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    createNotification: async (data) => {
        try {
            const notification = await prisma.notifications.create({
                data,
            });

            return notification;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    updateNotification: async (id, data) => {
        try {
            const notification = await prisma.notifications.update({
                where: {
                    id,
                },
                data,
            });

            return notification;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    deleteNotification: async (id) => {
        try {
            const notification = await prisma.notifications.delete({
                where: {
                    id,
                },
            });

            return notification;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    deleteNotificationTopic: async (id) => {
        try {
            const notification = await prisma.notificationTopic.delete({
                where: {
                    id,
                },
            });

            return notification;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    findOneNotification: async (id) => {
        try {
            const notification = await prisma.notifications.findFirst({
                where: {
                    id,
                },
                include: {
                    Topic: true
                }
            });

            return notification;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getAllUserInsideNotificationsTopic: async (id) => {
        try {
            const tokens = await prisma.userNotificationTopic.findMany({
                where: {
                    topicId: id,
                    active: true,
                },
                select: {
                    User: {
                        select: {
                            fcmToken: true,
                        },
                    },
                },
            });

            return tokens.map((e) => e.User.fcmToken);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getNotificationsTopic: async () => {
        try {
            const notifications = await prisma.notificationTopic.findMany({
                orderBy: {
                    createdAt: "desc",
                },
            });

            return notifications;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getNotificationByTopicId: async (notificationTopicId) => {
        try {
            const notification = await prisma.notifications.findMany({
                where: {
                    notificationTopicId,
                },
                include: {
                    Topic: true,
                }
            });

            return notification;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    createNewNotificationsTopic: async (data) => {
        try {
            const notification = await prisma.notificationTopic.create({
                data,
            });
            return notification;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    updateNotificationTopicById : async (id, data) => {
        try {
            const notification = await prisma.notificationTopic.update({
                where: {
                    id,
                },
                data,
            });
            return notification
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    createManyNotifications: async (data) => {
        try {
            const notifications = await prisma.notifications.createMany({
                data: data
            });
            return notifications;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

};
