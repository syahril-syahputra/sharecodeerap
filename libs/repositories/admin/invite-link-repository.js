const Sentry = require("@sentry/node");
const prisma = require("../../lib-prisma");
const {InviteLinkType} = require("@prisma/client");

const inviteLinkRepository = {
    createInviteLinkDB: async (data) => {
        try {
            let inviteLink = await prisma.inviteLink.create({
                data: {
                    ...data,
                },
            });

            return inviteLink;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    editInviteLinkDB: async (data, inviteLinkId) => {
        try {
            let inviteLink = await prisma.inviteLink.update({
                where: {
                  id: inviteLinkId
                },
                data: data,
            });

            return inviteLink;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getInviteLinks: async (paginationParameters) => {
        try {
            const inviteLinks = await prisma.inviteLink.findMany({
                ...paginationParameters,
                include: {
                    Product: true,
                    User: true,
                },
                orderBy : {
                    id : 'desc'
                }
            });

            const numInviteLink = await prisma.inviteLink.count();

            return {inviteLinks: inviteLinks, pagination: {...paginationParameters, total: numInviteLink}};
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    findOneById: async (id) => {
        try {
            const inviteLinks = await prisma.inviteLink.findFirst({
                where: {
                    id: id
                }
            });

            return inviteLinks;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    findOneBySlug: async (slug) => {
        try {
            const inviteLinks = await prisma.inviteLink.findFirst({
                where: {
                    slug: slug
                }
            });

            return inviteLinks;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    findOneBySlugDetailed: async (slug) => {
        try {
            const inviteLinks = await prisma.inviteLink.findFirst({
                where: {
                    slug: slug
                },
                include: {
                    Product: true,
                    User: true,
                },
            });

            return inviteLinks;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    deleteInviteLinkDB: async (inviteLinkId) => {
        try {
            const inviteLink = await prisma.inviteLink.delete({
                where: {
                    id: inviteLinkId,
                }
            });

            return inviteLink;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
}

module.exports = inviteLinkRepository;