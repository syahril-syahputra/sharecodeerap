const Sentry = require("@sentry/node");
const prisma = require("../lib-prisma");

module.exports = {
    getNotifications: async () => {
        try {
            const notif = await prisma.notificationTopic.findMany({
                where: {
                    NOT: {
                        tagName: {
                            startsWith: "local"
                        }
                    }
                }
            });

            return notif;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getLocalNotifications: async () => {
        try {
            const notif = await prisma.notifications.findMany({
                where: {
                    Topic: {
                        tagName: 'local-curiosity-spark'
                    }
                }
            });

            return notif;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    followNotificationTopic: async (user, notificationTopicId, active ) => {
        try {
            const find = await prisma.userNotificationTopic.findFirst({
                where: {
                    userId: user.id,
                    notificationTopicId,
                },
            });
            let result;
            if (!find) {
                result = await prisma.userNotificationTopic.create({
                    data: {
                        userId: user.id,
                        notificationTopicId,
                        active,
                    },
                });
            } else {
                result = await prisma.userNotificationTopic.update({
                    where: {
                        id: find.id,
                    },
                    data: {
                        active,
                        notificationTopicId
                    },
                });
            }

            return result;
        } catch (e) {
            throw(e)
        }
    },

    followOrUnfollowAllNotificationTopic: async (user, active) => {
        try {
            const notifs = await prisma.notificationTopic.findMany({
                where: {
                    NOT: {
                        tagName: {
                            startsWith: "local"
                        }
                    }
                }
            });
            let results = []
            notifs.map(async(notif) => {
                let result;
                const userCreated = await prisma.userNotificationTopic.findFirst({
                    where: {
                        userId: user.id, 
                        notificationTopicId: notif.id
                    }
                })
                if(userCreated) {
                    result = await prisma.userNotificationTopic.update({
                        where: {
                            id: userCreated.id,
                        },
                        data: {
                            active,
                            notificationTopicId: notif.id
                        },
                    });
                } else {
                    result = await prisma.userNotificationTopic.create({
                        data: {
                            userId: user.id,
                            active,
                            notificationTopicId: notif.id
                        },
                    });
                }
                results.push(result);
            })
            return results;
        } catch (e) {
            throw(e)
        }
    },

};
