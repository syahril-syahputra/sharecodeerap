const Sentry = require("@sentry/node");
const prisma = require("../../lib-prisma");
const {getExpirationFor2Days} = require("../../helpers/time");
const {WaitlistType} = require("@prisma/client");

const waitlistRepository = {
    createWaitlistDB: async (data) => {
        try {
            let waitlist = await prisma.waitlist.create({
                data: {
                    ...data,
                    status: WaitlistType.NOT_INVITED
                },
            });

            return waitlist;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    editWaitlistDB: async (data, waitlistId) => {
        try {
            let waitlist = await prisma.waitlist.update({
                where: {
                  id: waitlistId
                },
                data: data,
            });

            return waitlist;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getAllWaitlist: async (paginationParameters) => {
        try {
            const waitlists = await prisma.waitlist.findMany({
                ...paginationParameters,
                orderBy : {
                    id : 'desc'
                }
            });

            const numWaitlist = await prisma.waitlist.count();

            return {waitlists: waitlists, pagination: {...paginationParameters, total: numWaitlist}};
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    findOneById: async (id) => {
        try {
            const waitlists = await prisma.waitlist.findFirst({
                where: {
                    id: id
                },
                select : {
                    id : true,
                    email : true,
                    User : {
                        select : {
                            id : true,
                            account : true
                        } 
                    }
                }
            });

            return waitlists;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    deleteWaitlistDB: async (waitlistId) => {
        try {
            const waitlist = await prisma.waitlist.delete({
                where: {
                    id: waitlistId,
                }
            });

            return waitlist;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    inviteDB: async (userId, token, adminId) => {
        try {

            let waitlist = await prisma.waitlist.update({
                where: {
                    id: userId,
                },
                data: {
                    inviteToken: token,
                    inviteTokenExpires: getExpirationFor2Days(),
                    invitedAt: new Date(),
                    invitedById: adminId,
                    status: WaitlistType.INVITED
                }
            });

            return waitlist;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
}

module.exports = waitlistRepository;