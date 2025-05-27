const Sentry = require("@sentry/node");
const prisma = require("../lib-prisma");

const pointRepository = {
    getCurrentPoint: async (userId) => {
        try {
            const userPoint = await prisma.user.findFirst({
                where: {
                    id: userId,
                },
                select: {
                    points: true,
                },
            });
            return userPoint.points;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    updateUserPoint: async (userId, point) => {
        try {
            const updatePoint = await prisma.user.update({
                where: {
                    id: userId,
                },
                data: {
                    points: { increment: point },
                },
            });

            return { points: updatePoint.points };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
};

module.exports = pointRepository;
