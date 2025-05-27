const Sentry = require("@sentry/node");
const prisma = require("../../lib-prisma");
const normalizeEmail = require("normalize-email");
const render = require("../../helpers/render");
const statuscodes = require("../../helpers/statuscodes");
const Bcrypt = require("bcryptjs");
const { LogType, PromptType } = require("@prisma/client");
const dayjs = require("dayjs");
const { eurekaTokensSpent } = require("../../service/usageService");

const userRepository = {
    getAdminUsersPaginated: async (paginationParameters) => {
        try {
            const users = await prisma.adminUser.findMany({
                where: {},
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    canonicalEmail: true,
                    password: false,
                },
                ...paginationParameters,
            });

            const numUsers = await prisma.adminUser.count({
                where: {},
            });

            return {
                adminUsers: users,
                pagination: { ...paginationParameters, total: numUsers },
            };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getUsersPaginated: async (paginationParameters, accountId) => {
        try {
            const users = await prisma.user.findMany({
                where: {
                    accountId: accountId,
                },
                ...paginationParameters,
            });

            const numUsers = await prisma.user.count({
                where: {
                    accountId: accountId,
                },
            });

            return {
                users: users,
                pagination: { ...paginationParameters, total: numUsers },
            };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getUserDetail: async (userId) => {
        try {
            const user = await prisma.user.findFirst({
                where: {
                    id: userId,
                },
                include: {
                    Language: true,
                    UserLevel: true,
                },
            });
            user.questionAsked = await prisma.prompt.count({
                where: {
                    userId,
                    type: PromptType.DEFAULT,
                },
            });
            // console.log(dayjs().startOf('month').toDate(    ))
            user.questionInMonth = await prisma.prompt.count({
                where: {
                    userId,
                    type: PromptType.DEFAULT,
                    createdAt: {
                        gte: dayjs().startOf("month").toDate(),
                        lte: dayjs().endOf("month").toDate(),
                    },
                },
            });
            const used = await prisma.prompt.findMany({
                where: {
                    userId,
                },
                select: {
                    id : true,
                    totalTokens: true,
                    response: true,
                },
            });

            user.tokenUsed =
                used
                    .map((e) => e.totalTokens)
                    .reduce(
                        (accumulator, currentValue) =>
                            accumulator + currentValue,
                        0
                    ) *
                    process.env.RATIO_EUREKA_TO_OPENAI_TOKENS +
                process.env.RATIO_EUREKA_TO_TTS_CHARS *
                    used
                        .map((e) => e.response !== null ? e.response.length : 0)
                        .reduce(
                            (accumulator, currentValue) =>
                                accumulator + currentValue,
                            0
                        );

            const countAppOpenend = await prisma.log.count({
                where: {
                    userId,
                    type: LogType.USER_OPENED_APP,
                },
            });
            return { ...user, countAppOpenend };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getAdminUserDetail: async (userId) => {
        try {
            const user = await prisma.adminUser.findFirst({
                where: {
                    id: userId,
                },
            });

            return user;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    deleteUserDB: async (userId) => {
        try {
            const user = await prisma.user.delete({
                where: {
                    id: userId,
                },
            });

            return user;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    setVerifiedDB: async (userId, verified) => {
        try {
            const user = await prisma.user.update({
                where: {
                    id: userId,
                },
                data: {
                    verified: verified,
                    verificationToken: null,
                    verificationTokenExpires: null,
                },
            });

            return user;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    updateLevelUser: async (id, levelId) => {
        try {
            const level = await prisma.userLevel.findFirst({
                where: {
                    id: levelId,
                },
            });
            // console.log(levelId);
            // console.log(level);
            if (!level) return null;
            const lowerLevel = await prisma.userLevel.findFirst({
                where: {
                    tier: {
                        lt: level.tier,
                    },
                },
                orderBy: {
                    tier: "desc",
                }
            });
            const user = await prisma.user.update({
                where: {
                    id,
                },
                data: {
                    userLevelId: level.id,
                    ...(lowerLevel
                        ? { points: lowerLevel.points + 1 }
                        : { points: 0 }),
                },
            });

            return user;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    updateUserPoint: async (id, points) => {
        try {
            console.log(points);
            let level;
            level = await prisma.userLevel.findFirst({
                where: {
                    points : {
                        gte : points
                    }
                },
                orderBy : {
                    points : "asc"
                }
            });
            if(!level) {
                level = await prisma.userLevel.findFirst({
                    where : {
                        points : {
                            lte : points
                        }
                    },
                    orderBy : {
                        points : "desc"
                    }
                })
            }
            const user = await prisma.user.update({
                where: {
                    id,
                },
                data: {
                    points,
                    ...(level ? { userLevelId: level.id } : {}),
                },
            });
            return user;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    createAdminUser: async (data) => {
        data.password = Bcrypt.hashSync(data.password, 10);
        data.canonicalEmail = normalizeEmail(data.email);
        try {
            const user = await prisma.adminUser.create({
                data,
            });

            return user;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    isAdminUserEmailExist: async (email, res) => {
        try {
            console.log("IN");
            const canonicalEmail = normalizeEmail(email);

            const count = await prisma.adminUser.count({
                where: {
                    canonicalEmail: canonicalEmail,
                },
            });

            if (count > 0) {
                return true;
            } else {
                return false;
            }
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    // isAdminUserUserNameExist: async (userName, res) => {
    //     try {
    //         const count = await prisma.adminUser.count({
    //             where: {
    //                 userName: userName
    //             }
    //         });
    //
    //
    //         if (count > 0) {
    //             return true;
    //         } else {
    //             return false;
    //         }
    //
    //     } catch (e) {
    //         console.error(e);
    //         Sentry.captureException(e);
    //         render(res, 500, statuscodes.DB_ERROR, {});
    //     }
    // },
    deleteAdminUserDB: async (userId, res) => {
        try {
            const user = await prisma.adminUser.delete({
                where: {
                    id: userId,
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    // userName: true,
                    email: true,
                    canonicalEmail: true,
                    password: false,
                },
            });

            return user;
        } catch (e) {
            if (e.code === "P2025") {
                render(res, 400, statuscodes.USER_NOT_FOUND, {});
                return;
            }

            console.error(e);
            Sentry.captureException(e);
        }
    },
    updateAdminUserDB: async (userId, value, res) => {
        try {
            if (value.password && value.password.length > 0) {
                value.password = Bcrypt.hashSync(value.password, 10);
            }

            const user = await prisma.adminUser.update({
                where: {
                    id: parseInt(userId),
                },
                data: {
                    ...value,
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    // userName: true,
                    email: true,
                    canonicalEmail: true,
                    password: false,
                },
            });

            return user;
        } catch (e) {
            if (e.code === "P2025") {
                render(res, 400, statuscodes.USER_NOT_FOUND, {});
                return;
            }

            console.error(e);
            Sentry.captureException(e);
        }
    },

    getUserFCMTokens: async (notificationTopicId) => {
        try {
            const userTokens = await prisma.user.findMany({
                select: {
                    timezone: true,
                    fcmToken: true,
                    languageId: true,
                },
                where: {
                    NOT: {
                        fcmToken: null,
                    },
                    UserNotificationTopic: {
                        every: {
                            notificationTopicId: notificationTopicId,
                            active: true,
                        },
                    },
                },
            });
            return userTokens;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    findUserWithPrompts: async (userId) => {
        try {
            let user = await prisma.user.findFirst({
                where: {
                    id: userId,
                },
                include: {
                    Session: {
                        include: {
                            Prompts: true
                        }
                    }
                },
            });

            return user;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
};

module.exports = userRepository;
