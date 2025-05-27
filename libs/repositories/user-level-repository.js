const Sentry = require("@sentry/node");
const prisma = require("../lib-prisma");

const userLevelRepository = {

    getAll: async () => {
        try {
            const levels = await prisma.userLevel.findMany({
                orderBy: [
                    {
                        tier: 'asc',
                    }
                ],
            });
            return levels;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    getUserLevelTier1: async () => {

        let result = await prisma.userLevel.findFirst({
            where: {
                tier: 1,
            },
        });

        return result;
    },
    getUserLevelTier0: async () => {

        let result = await prisma.userLevel.findFirst({
            where: {
                tier: 0,
            },
        });

        return result;
    },

}

module.exports = userLevelRepository;