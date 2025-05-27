const normalizeEmail = require('normalize-email');
const Sentry = require("@sentry/node");
const render = require('../helpers/render');
const statuscodes = require('../helpers/statuscodes');
const Bcrypt = require("bcryptjs");
const prisma = require("../lib-prisma");

const adminRepository = {
    //
    // registerNewUser: async (data, account) => {
    //
    //     let verificationToken = crypto.randomBytes(16).toString("hex");
    //     let userLevel = await getUserLevelTier1();
    //
    //     const newUser = {
    //         firstname: data.firstname,
    //         lastname: data.lastname,
    //         email: data.email,
    //         canonicalEmail: normalizeEmail(data.email),
    //         password: Bcrypt.hashSync(data.password, 10),
    //         accountId: account.id,
    //         pin: data.pin,
    //         isAdmin: true,
    //         verified: false,
    //         verificationToken: verificationToken,
    //         verificationTokenExpires: getExpiration(),
    //         userLevelId: userLevel.id,
    //         talkMethod: TalkMethod.Tap
    //     };
    //
    //     let result = await prisma.user.create({
    //         data: newUser,
    //         select: {
    //             id: true,
    //             email: true,
    //             firstname: true,
    //             lastname: true,
    //         },
    //     });
    //
    //     await sendLocalTemplateEmail("Confirm account", [data.email], "confirm.html", {
    //         link: process.env.FRONTEND_URL + "/confirm/" + verificationToken,
    //     })
    //
    //     return result;
    // },
    //
    // createUser: async (data, account) => {
    //
    //     let userLevel = await getUserLevelTier1();
    //
    //     let result = await prisma.user.create({
    //         data: {
    //             firstname: data.firstname,
    //             lastname: data.lastname,
    //             accountId: account.id,
    //             pin: data.pin || null,
    //             isAdmin: data.isAdmin || false,
    //             verified: true,
    //             verificationToken: null,
    //             verificationTokenExpires: null,
    //             userLevelId: userLevel.id,
    //             talkMethod: TalkMethod.Tap
    //         },
    //         select: {
    //             id: true,
    //             firstname: true,
    //             lastname: true,
    //         },
    //     });
    //
    //     return result;
    // },

    createAdminUserInvite: async (data, password) => {

        let result = await prisma.adminUser.create({
            data: {
                email: data.email,
                canonicalEmail: normalizeEmail(data.email),
                password: Bcrypt.hashSync(password, 10),
                firstName: "",
                lastName: "",
                // userName: normalizeEmail(data.email),
            },
            select: {
                id: true
            },
        });

        return result;
    },

    // createUserFromInviteConfirm: async (user, data) => {
    //
    //     let result = await prisma.user.update({
    //         where: {
    //             id: user.id
    //         },
    //         data: {
    //             verificationToken: null,
    //             verificationTokenExpires: null,
    //             firstname: data.firstname,
    //             lastname: data.lastname,
    //             password: Bcrypt.hashSync(data.password, 10),
    //             pin: data.pin,
    //             verified: true
    //         }
    //     });
    //
    //     return result;
    // },

    isAdminUserEmailExist: async (value, res) => {
        try {
            const canonicalEmail = normalizeEmail(value);

            const count = await prisma.adminUser.count({
                where: {
                    canonicalEmail: canonicalEmail
                }
            });

            return count > 0;

        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },

    // existUserByName: async (accountId, firstname, lastname) => {
    //     try {
    //
    //         const count = await prisma.user.count({
    //             where: {
    //                 accountId: accountId,
    //                 firstname: firstname,
    //                 lastname: lastname
    //             }
    //         });
    //
    //         return count > 0;
    //
    //     } catch (e) {
    //         console.error(e);
    //         Sentry.captureException(e);
    //         render(res, 500, statuscodes.DB_ERROR, {});
    //     }
    // },

    findAdminUserByEmailOrUsername: async (email) => {

        let user = await prisma.adminUser.findFirst({
            where: {
                OR: [
                    {canonicalEmail: normalizeEmail(email)},
                ]
            }
        });

        return user;
    },
    findAdminUserByEmail: async (email) => {

        let user = await prisma.adminUser.findFirst({
            where: {
                canonicalEmail: normalizeEmail(email),
            }
        });

        return user;
    },

    findAdminUserById: async (id) => {

        let user = await prisma.adminUser.findFirst({
            where: {
                id: id,
            }
        });

        return user;
    },

    // findUserByIdAndAccount: async (id, accountId) => {
    //
    //     let user = await prisma.user.findFirst({
    //         where: {
    //             id: id,
    //             accountId: accountId
    //         },
    //         select: {
    //             id: true,
    //             email: true,
    //             firstname: true,
    //             lastname: true,
    //             verified: true,
    //             pin: true,
    //             isAdmin: true
    //         }
    //     });
    //
    //     return user;
    // },
    //
    // findUserByInviteToken: async (inviteToken) => {
    //
    //     let user = await prisma.user.findFirst({
    //         where: {
    //             verificationToken: inviteToken,
    //         }
    //     });
    //
    //     return user;
    // },
    //
    // findBasicUserById: async (id) => {
    //
    //     let user = await prisma.user.findFirst({
    //         where: {
    //             id: parseInt(id),
    //         },
    //         select: basicSelect
    //     });
    //
    //     return user;
    // },
    //
    // deleteUser: async (id) => {
    //
    //     let user = await prisma.user.delete({
    //         where: {
    //             id: parseInt(id),
    //         },
    //     });
    //
    //     return user;
    // },
    //
    // editUser: async (id, data, user) => {
    //
    //     let dailyRecap = user.dailyRecap;
    //     if(data.dailyRecap !== undefined){
    //         dailyRecap = data.dailyRecap;
    //     }
    //
    //     if(data.social !== undefined){
    //         await createUserSocialForUser(user, data.social);
    //     }
    //
    //     let updatedUser = await prisma.user.update({
    //         where: {
    //             id: parseInt(id),
    //         },
    //         data: {
    //             firstname: data.firstname || user.firstname,
    //             lastname: data.lastname || user.lastname,
    //             pin: data.pin || user.pin,
    //             languageId: data.languageId || user.languageId,
    //             birthday: data.birthday || user.birthday,
    //             talkMethod: data.talkMethod || user.talkMethod,
    //             dailyRecap: dailyRecap,
    //         }
    //     });
    //
    //     return updatedUser;
    // },
    //
    // setAdmin: async (userId, isAdmin) => {
    //
    //     let user = await prisma.user.update({
    //         where: {
    //             id: parseInt(userId),
    //         },
    //         data: {
    //             isAdmin: isAdmin
    //         }
    //     });
    //
    //     return user;
    // },
    //
    // countUsersPerAccount: async (accountId) => {
    //     try {
    //         const count = await prisma.user.count({
    //             where: {
    //                 accountId: accountId
    //             }
    //         });
    //
    //         return count;
    //
    //     } catch (e) {
    //         console.error(e);
    //         Sentry.captureException(e);
    //         render(res, 500, statuscodes.DB_ERROR, {});
    //     }
    // },
    //
    // countRemainingAdminUsers: async (accountId, userId) => {
    //     try {
    //         const count = await prisma.user.count({
    //             where: {
    //                 isAdmin: true,
    //                 accountId: accountId,
    //                 NOT: {
    //                     id: userId
    //                 }
    //             }
    //         });
    //
    //         return count;
    //
    //     } catch (e) {
    //         console.error(e);
    //         Sentry.captureException(e);
    //     }
    // },
    //
    // getAllUsersFromAccount: async (accountId, paginationParameters) => {
    //     try {
    //         const users = await prisma.user.findMany({
    //             where: {
    //                 accountId: accountId,
    //             },
    //             select: basicSelect,
    //             ...paginationParameters
    //         });
    //
    //         const numUsers = await prisma.user.count({
    //             where: {
    //                 accountId: accountId,
    //             }
    //         });
    //
    //         return {users: users, pagination: {...paginationParameters, total: numUsers}};
    //     } catch (e) {
    //         console.error(e);
    //         Sentry.captureException(e);
    //     }
    // }
}

module.exports = adminRepository;