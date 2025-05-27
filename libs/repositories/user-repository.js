const normalizeEmail = require("normalize-email");
const Sentry = require("@sentry/node");
const render = require("../helpers/render");
const statuscodes = require("../helpers/statuscodes");
const Bcrypt = require("bcryptjs");
const { getExpiration } = require("../helpers/time");
const {
    getUserLevelTier1,
    getUserLevelTier0,
} = require("./user-level-repository");
const { createUserSocialForUser } = require("./social-repository");
const TalkMethod = require("../helpers/talk-method");
const prisma = require("../lib-prisma");
const redis = require("../lib-ioredis");

let basicSelect = {
    id: true,
    email: true,
    firstname: true,
    lastname: true,
    verified: true,
    isAdmin: true,
    talkMethod: true,
    userLevelId: true,
    points: true,
    birthday: true,
    languageId: true,
    UserLevel: true,
    questionAsked: true,
    dailyRecap: true,
    weeklyRecap: true,
    voiceCode: true,
    account: {
        include: {
            Product: true,
            Plan: true,
        },
    },
    fcmToken: true,
    UserNotificationTopic: {
        include: {
            NotificationTopic: true,
        },
    },
};

const userRepository = {
    registerNewUser: async (data, account) => {
        let userLevel = await getUserLevelTier0();
        const newUser = {
            firstname: data.firstname,
            lastname: data.lastname,
            email: data.email,
            canonicalEmail: normalizeEmail(data.email),
            accountId: account.id,
            isAdmin: true,
            verified: data.verified || false,
            userLevelId: userLevel.id,
            talkMethod: data.talkMethod || TalkMethod.Tap,
            loginPin: data.loginPin,
            loginToken: data.loginToken,
            loginTokenExpires: getExpiration(),
            country: data.country,
            birthday: data.birthday,
            dailyRecap: data.dailyRecap,
            fcmToken: data.fcmToken,
            timezone: data.timezone,
        };

        let result = await prisma.user.create({
            data: newUser,
            select: basicSelect,
        });

        if (data.social !== undefined) {
            await createUserSocialForUser(result, data.social);
        }

        return result;
    },

    createUser: async (data, account) => {
        let userLevel = await getUserLevelTier0();

        let result = await prisma.user.create({
            data: {
                firstname: data.firstname,
                lastname: data.lastname,
                accountId: account.id,
                pin: data.pin || null,
                isAdmin: data.isAdmin || false,
                verified: true,
                userLevelId: userLevel.id,
                talkMethod: TalkMethod.Tap,
                fcmToken: data.fcmToken || null,
                talkMethod: TalkMethod.Tap,
                timezone: data.timezone || null,
            },
            select: {
                id: true,
                firstname: true,
                lastname: true,
            },
        });

        return result;
    },

    createUserInvite: async (data, account, inviteToken) => {
        let userLevel = await getUserLevelTier0();
        let result = await prisma.user.create({
            data: {
                accountId: account.id,
                email: data.email,
                canonicalEmail: normalizeEmail(data.email),
                isAdmin: data.isAdmin || false,
                inviteToken: inviteToken,
                inviteTokenExpires: getExpiration(),
                userLevelId: userLevel.id,
                talkMethod: TalkMethod.Tap,
            },
            select: {
                id: true,
            },
        });

        return result;
    },

    createUserFromInviteConfirm: async (user, data) => {
        let result = await prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                inviteToken: null,
                inviteTokenExpires: null,
                firstname: data.firstname,
                lastname: data.lastname,
                password: Bcrypt.hashSync(data.password, 10),
                pin: data.pin,
                verified: true,
            },
        });

        return result;
    },

    isUserEmailExist: async (value, res) => {
        try {
            const canonicalEmail = normalizeEmail(value);

            const count = await prisma.user.count({
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

    existUserByName: async (accountId, firstname, lastname) => {
        try {
            const count = await prisma.user.count({
                where: {
                    accountId: accountId,
                    firstname: firstname,
                    lastname: lastname,
                },
            });

            return count > 0;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },

    findUserByEmail: async (email) => {
        let user = await prisma.user.findFirst({
            include: {
                account: true,
            },
            where: {
                canonicalEmail: normalizeEmail(email),
                verified: true,
            },
        });

        return user;
    },

    findUserById: async (id) => {
        let user = await prisma.user.findFirst({
            include: {
                account: true,
                Language: true,
                UserLevel: true,
            },
            where: {
                id: id,
            },
        });

        return user;
    },

    findUserByCustomerId: async (customerId) => {
        let user = await prisma.user.findFirst({
            include: {
                account: {
                    include: {
                        Product: true,
                        Plan: true,
                    },
                },
            },
            where: {
                account: {
                    customerId: customerId,
                },
            },
        });

        return user;
    },

    findUserByIdAndAccount: async (id, accountId) => {
        let user = await prisma.user.findFirst({
            where: {
                id: id,
                accountId: accountId,
            },
            select: {
                id: true,
                email: true,
                firstname: true,
                lastname: true,
                verified: true,
                pin: true,
                isAdmin: true,
                talkMethod: true,
            },
        });

        return user;
    },

    findUserByInviteToken: async (inviteToken) => {
        let user = await prisma.user.findFirst({
            where: {
                inviteToken: inviteToken,
            },
        });

        return user;
    },

    findBasicUserById: async (id) => {
        let user = await prisma.user.findFirst({
            where: {
                id: parseInt(id),
            },
            select: basicSelect,
        });

        return user;
    },

    findUserEmailByReceipt: async (receipt) => {
        let email = await prisma.user.findFirst({
            where: {
                account: {
                    appleReceipt: receipt,
                },
            },
            select: {
                email: true,
            },
        });

        return email;
    },

    editDeviceUser: async (id, device) => {
        let user = await prisma.user.update({
            where: {
                id: parseInt(id),
            },
            data: {
                device,
            },
        });
        return user;
    },
    updateUserData: async (id, fcmToken, timezone) => {
        let user = await prisma.user.update({
            where: {
                id: parseInt(id),
            },
            data: {
                fcmToken,
                timezone,
            },
        });
        return user;
    },
    deleteUser: async (id) => {
        let user = await prisma.user.delete({
            where: {
                id: parseInt(id),
            },
        });

        return user;
    },

    editUser: async (id, data, user) => {
        let dailyRecap = data.dailyRecap;
        if (data.social !== undefined) {
            await createUserSocialForUser(user, data.social);
        }

        let updatedUser = await prisma.user.update({
            where: {
                id: parseInt(id),
            },
            data: {
                firstname: data.firstname || user.firstname,
                lastname: data.lastname || user.lastname,
                pin: data.pin || user.pin,
                languageId: data.languageId || user.languageId,
                birthday: data.birthday || user.birthday,
                talkMethod: data.talkMethod || user.talkMethod,
                dailyRecap: dailyRecap,
                weeklyRecap: data.weeklyRecap || user.weeklyRecap,
                fcmToken: data.fcmToken || user.fcmToken,
                timezone: data.timezone || user.timezone,
                voiceCode: data.voiceCode || user.voiceCode,
            },
        });

        return updatedUser;
    },

    editUserWithWebhook: async (id, data) => {
        let updatedUser = await prisma.user.update({
            where: {
                id: parseInt(id),
            },
            data: data,
        });

        return updatedUser;
    },

    setAdmin: async (userId, isAdmin) => {
        let user = await prisma.user.update({
            where: {
                id: parseInt(userId),
            },
            data: {
                isAdmin: isAdmin,
            },
        });

        return user;
    },

    countUsersPerAccount: async (accountId) => {
        try {
            const count = await prisma.user.count({
                where: {
                    accountId: accountId,
                },
            });

            return count;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },

    countRemainingAdminUsers: async (accountId, userId) => {
        try {
            const count = await prisma.user.count({
                where: {
                    isAdmin: true,
                    accountId: accountId,
                    NOT: {
                        id: userId,
                    },
                },
            });

            return count;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    getAllUsersFromAccount: async (accountId, paginationParameters) => {
        try {
            const users = await prisma.user.findMany({
                where: {
                    accountId: accountId,
                },
                select: basicSelect,
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

    updateLastInteraction: async (id) => {
        await prisma.user.update({
            where: {
                id: parseInt(id),
            },
            data: {
                lastInteraction: new Date(),
            },
        });
    },

    verifyUser: async (id) => {
        await prisma.user.update({
            where: {
                id: parseInt(id),
            },
            data: {
                verified: true,
                loginPin: null,
                loginToken: null,
                loginTokenExpires: null,
            },
        });
    },

    lastLoginUpdate: async (id) => {
        await prisma.user.update({
            where: {
                id: parseInt(id),
            },
            data: {
                lastLogin: new Date(),
            },
        });
    },

    findAnyUserByEmail: async (email) => {
        let user = await prisma.user.findFirst({
            include: {
                account: true,
            },
            where: {
                canonicalEmail: normalizeEmail(email),
            },
        });

        return user;
    },

    createLoginCredentials: async (id, loginPin, loginToken) => {
        let result = await prisma.user.update({
            where: {
                id: parseInt(id),
            },
            data: {
                loginPin: loginPin,
                loginToken: loginToken,
                loginTokenExpires: getExpiration(),
            },
        });

        return result;
    },

    setUserVoice: async (id, data) => {
        let updatedUser = await prisma.user.update({
            where: {
                id: parseInt(id),
            },
            data,
        });

        return updatedUser;
    },

    updateUserPointsAndLevel: async (userId, levelId) => {
        try {
            const user = await prisma.user.findFirst({
                where: {
                    id: userId,
                },
            });
            if (user.userLevelId == levelId) {
                return {
                    isLevelUp: false,
                };
            } else {
                let level = await prisma.userLevel.findFirst({
                    where: {
                        id: levelId,
                    },
                });
                let updatedUser = await prisma.user.updateMany({
                    where: {
                        id: parseInt(userId),
                    },
                    data: {
                        userLevelId: levelId,
                    },
                });

                await redis.publish(
                    "mattermost:userlevelup",
                    JSON.stringify({
                        message: `${user.email} Reached new level ${level.tier} - ${level.name}`,
                    })
                );

                return {
                    isLevelUp: true,
                    userLevel: {
                        ...level,
                    },
                };
            }
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    updateQuestionAsked: async (userId, question) => {
        try {
            let updatedUser = await prisma.user.update({
                where: {
                    id: parseInt(userId),
                },
                data: {
                    questionAsked: question,
                },
            });
            return updatedUser;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    joinNewsletter: async (userId) => {
        try {
            let updateNewsLetter = await prisma.user.update({
                where: {
                    id: parseInt(userId),
                },
                data: {
                    isJoinNewsletter: true,
                    joinNewsletterAt: new Date(),
                },
            });

            return updateNewsLetter;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getAllUsersSwitchProfile: async (accountId) => {
        try {
            const users = await prisma.user.findMany({
                where: {
                    accountId: accountId,
                },
            });

            return users;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    setInviteLink: async (userId, inviteLinkId) => {
        try {
            let updatedUser = await prisma.user.update({
                where: {
                    id: parseInt(userId),
                },
                data: {
                    inviteLinkId: inviteLinkId,
                },
            });
            return updatedUser;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    editLanguageUser: async (userId, languageId) => {
        try {
            let updateUser = await prisma.user.update({
                where: {
                    id: parseInt(userId),
                },
                data: {
                    languageId,
                },
                include: {
                    Language: true,
                    Session: true,
                },
            });
            return {
                language: updateUser.Language,
            };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    editRecapSettingUser: async (id, data) => {
        try {
            let updateUser = await prisma.user.update({
                where: {
                    id,
                },
                data,
            });
            return {
                daily: updateUser.dailyRecap,
                weekly: updateUser.weeklyRecap,
            };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    createNewAudience: async (email, device) => {
        try {
            let abandoned = await prisma.abandonedEmail.findMany({
                where: {
                    email,
                },
            });

            if (abandoned.length) return false;
            else {
                let newAudience = await prisma.abandonedEmail.create({
                    data: {
                        email,
                        device,
                    },
                });

                return newAudience;
            }
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    deleteAudience: async (email) => {
        try {
            let abandoned = await prisma.abandonedEmail.findMany({
                where: {
                    email: {
                        contains: email,
                    },
                },
            });

            if (!abandoned.length) return false;
            else {
                let deleted = await prisma.abandonedEmail.deleteMany({
                    where: {
                        email: {
                            contains: email,
                        },
                    },
                });

                console.log(
                    `Deleted User From Abandoned Users with email : ${email}`
                );

                return deleted;
            }
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    getUserThreadId: async (userId) => {
        try {
            let user = await prisma.user.findFirst({
                where: {
                    id: parseInt(userId),
                },
                select: {
                    threadId: true
                }
            });
    
            return user.threadId;
        } catch(e) {
            console.error(e);
            Sentry.captureException(e);
        }
        

    },

    updateThreadId: async (id, threadId) => {
        try {
            let updatedUser = await prisma.user.update({
                where: {
                    id: parseInt(id),
                },
                data: {
                    threadId: threadId
                },
            });
    
            return updatedUser;
        } catch(e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    updateInterests: async (id, interests, personalInformation) => {
        try {

            if(!interests || interests.length <=0 ){
                return
            }

            let updatedUser = await prisma.user.update({
                where: {
                    id: parseInt(id),
                },
                data: {
                    interests: interests,
                    personalInformation: personalInformation,
                },
            });

            return updatedUser;
        } catch(e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

};

module.exports = userRepository;
