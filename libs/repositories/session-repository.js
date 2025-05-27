const Sentry = require("@sentry/node");
const prisma = require("../lib-prisma");
const UserRepository = require("./user-repository");

const sessionRepository = {

    getLastUserSession: async (user) => {
        try {
            const session = await prisma.session.findFirst({
                where: {
                    userId: user.id,
                },
                orderBy: [
                    {
                        id: 'desc',
                    },
                ],
                include: {
                    Prompts: true,
                    DefaultPrompt: {
                        include: {
                            mainParams: {
                                include:{
                                    Engine: true
                                }
                            },
                            explainMoreParams: {
                                include:{
                                    Engine: true
                                }
                            },
                            funFactsParams: {
                                include:{
                                    Engine: true
                                }
                            },
                        }
                    }
                },
            });
            return session;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    createSessionForUser: async (user, initialPrompt) => {
        try {

            let session = await prisma.session.create({
                data: {
                    userId: user.id,
                    endedAt: null,
                    processed: false,
                    processedPrompt: false,
                    DefaultPromptId: initialPrompt.id,
                },
                include: {
                    DefaultPrompt: {
                        include: {
                            mainParams: {
                                include:{
                                    Engine: true
                                }
                            },
                            explainMoreParams: {
                                include:{
                                    Engine: true
                                }
                            },
                            funFactsParams: {
                                include:{
                                    Engine: true
                                }
                            },
                        }
                    }
                },
            });

            return session;

        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    getLastProcessedPrompt: async (userId) => {
        try {

            if(!userId){
                return null;
            }

            const prompt = await prisma.session.findFirst({
                where: {
                    userId : userId,
                    processed: true,
                },
                include: {
                    Prompts: true
                },
                orderBy: [
                    {
                        id: 'desc',
                    },
                ],
            });

            return prompt?.processedPrompt || null;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    closeSession: async (session, interests, personalInformation) => {
        try {
            const closedSession = await prisma.session.update({
                where: {
                    id : session.id,
                },
                data: {
                    processed: true,
                    // processedPrompt: processedPrompt || {},
                    endedAt: new Date(),
                }
            });

            await UserRepository.updateInterests(session.userId, interests, personalInformation);

            return closedSession;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    sessionUpdated: async (session) => {
        try {
            const sess = await prisma.session.update({
                where: {
                    id : session.id,
                },
                data: {
                    updatedAt: new Date(),
                }
            });

            return sess;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    getExpiredSessions: async () => {
        try {
            const result = await prisma.$queryRaw`select * from Session
                                       where processed = false
                                       and updatedAt < DATE_SUB(NOW(), INTERVAL 5 MINUTE)`;

            // const result = await prisma.session.findMany({
            //     where: {
            //         processed: false,
            //         updatedAt: {
            //             lt:
            //         }
            //     },
            //     include: {
            //         Prompts: true
            //     },
            // });

            return result;

        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
}

module.exports = sessionRepository;