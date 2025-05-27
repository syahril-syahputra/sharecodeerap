const Sentry = require("@sentry/node");
const prisma = require("../../lib-prisma");

const userLevelRepository = {
    createUserLevelDB: async (data) => {
        try {
            let userLevel = await prisma.userLevel.create({
                data: data,
            });

            return userLevel;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    editUserLevelDB: async (data, userLevelId) => {
        try {
            let userLevel = await prisma.userLevel.update({
                where: {
                  id: userLevelId
                },
                data: data,
            });

            return userLevel;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getAllUserLevels: async (paginationParameters) => {
        try {
            const userLevels = await prisma.userLevel.findMany({
                ...paginationParameters,
                include : {
                    Topic : {
                        include : {
                            UserLevel : true
                        }
                    }
                }
            });

            const numUserLevels = await prisma.userLevel.count();

            return {userLevels: userLevels, pagination: {...paginationParameters, total: numUserLevels}};
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    deleteUserLevelDB: async (userLevelId) => {
        try {
            const userLevel = await prisma.userLevel.delete({
                where: {
                    id: userLevelId,
                }
            });

            return userLevel;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
}

module.exports = userLevelRepository;