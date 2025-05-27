const Sentry = require("@sentry/node");
const prisma = require("../../lib-prisma");

const ageRangeRepository = {
    getAllAgeRange: async () => {
        try {
            const result = await prisma.ageRange.findMany();
            return result;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    createAgeRange: async (data) => {
        try {
            const result = await prisma.ageRange.create({
                data,
            });

            return result;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    editAgeRange: async (id, data) => {
        try {
            const result = await prisma.ageRange.update({
                where: {
                    id,
                },
                data,
            });

            return result;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    deleteAgeRange: async (id) => {
        try {
            const result = await prisma.ageRange.delete({
                where: {
                    id,
                },
            });
            return result;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
};

module.exports = ageRangeRepository