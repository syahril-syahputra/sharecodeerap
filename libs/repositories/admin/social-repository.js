const Sentry = require("@sentry/node");
const prisma = require("../../lib-prisma");

const socialRepository = {
    createSocialDB: async (data) => {
        try {
            let social = await prisma.social.create({
                data: data,
            });

            return social;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    editSocialDB: async (data, socialId) => {
        try {
            let social = await prisma.social.update({
                where: {
                  id: socialId
                },
                data: data,
            });

            return social;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getAllSocials: async (paginationParameters) => {
        try {
            const socials = await prisma.social.findMany({
                ...paginationParameters
            });

            const numSocials = await prisma.social.count();

            return {socials: socials, pagination: {...paginationParameters, total: numSocials}};
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    deleteSocialDB: async (socialId) => {
        try {
            const social = await prisma.social.delete({
                where: {
                    id: socialId,
                }
            });

            return social;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
}

module.exports = socialRepository;