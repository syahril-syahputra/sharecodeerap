const Sentry = require("@sentry/node");
const prisma = require("../lib-prisma");
const {WaitlistType} = require("@prisma/client");

const waitlistRepository = { 
    createWaitlist : async (data) => {
        try {
            let waitlist = await prisma.waitlist.create({
                data : data
            })

            return waitlist
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    isEmailExist : async (email) => {
        try {
            
            let isExist = await prisma.waitlist.findMany({
                where : {
                    email : email
                }
            })
             
            if(isExist.length > 0) return true
            else return false

        } catch (e) {
            console.error(e)
            Sentry.captureException(e)
        }
    },

    findOneByInvitationToken: async (token) => {
        try {
            const waitlists = await prisma.waitlist.findFirst({
                where: {
                    inviteToken: token
                }
            });

            return waitlists;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    findOneByEmail: async (email) => {
        try {
            const waitlists = await prisma.waitlist.findFirst({
                where: {
                    email: email
                },
                select : {
                    id : true,
                    status : true,
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

    redeemToken: async (id) => {
        try {
            const waitlists = await prisma.waitlist.update({
                where: {
                    id: id
                },
                data: {
                    status: WaitlistType.REDEEMED,
                    inviteToken: null,
                    inviteTokenExpires: null,
                    redeemedAt: new Date()
                }
            });

            return waitlists;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    deleteWaitlist : async (email) => {
        try {
            const findFirst = await prisma.waitlist.findFirst({
                where : {
                    email
                }
            })
            
            if(!findFirst) {
                return null
            } else {
                const deleteWaitlist = await prisma.waitlist.delete({
                    where : {
                        email  : findFirst.email
                    }
                })

                return true
            }

        } catch (e) {
            console.log(e)
            Sentry.captureException(e)
        }
    },
    getAllTrialing : async () => {
        try {
            const many = await prisma.waitlist.count({
                where : {
                    status : WaitlistType.REDEEMED_7DAYS
                }
            })
            console.log(many, 'Users on trialing')
            if(many <= 100) return true
            else return false 
        } catch (e) {
            console.log(e)
            Sentry.captureException(e)
        }
    },
    create7DaysTrial: async (email) => {
        try {
            const createDB = await prisma.waitlist.create({
                data : {
                    email,
                    status : WaitlistType.REDEEMED_7DAYS
                }
            })
            console.log(createDB)
            return createDB
        } catch (e) {
            console.log(e)
            Sentry.captureException(e)
        }
    }

}

module.exports = waitlistRepository