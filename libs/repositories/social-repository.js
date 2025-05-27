const Sentry = require("@sentry/node");
const prisma = require("../lib-prisma");

const socialRepository = {

    getAll: async () => {
        try {
            const social = await prisma.social.findMany();
            return social;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    findByIds: async (ids) => {
        try {
            const social = await prisma.social.findMany({
                where: {
                    id: {in: ids},
                }
            });
            return social;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    findByUserAndId: async (userId, socialId) => {
        try {
            const social = await prisma.userSocial.findFirst({
                where: {
                    userId: userId,
                    socialId: socialId,
                }
            });
            return social;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    createUserSocialForUser: async (user, ids) => {
        try {

            await prisma.userSocial.deleteMany({
                where: {
                    userId: user.id,
                }
            })
            ids.map(async id => {
                await prisma.userSocial.create({
                    data: {
                        userId: user.id,
                        socialId: id,
                    }
                });
            })

        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
}

module.exports = socialRepository;