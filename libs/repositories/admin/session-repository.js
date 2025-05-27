const Sentry = require("@sentry/node");
const prisma = require("../../lib-prisma");
const { PromptType } = require("@prisma/client");

const sessionRepository = {

    getSessionsPaginated: async (userId, paginationParameters) => {
        try {
            const sessions = await prisma.session.findMany({
                where: {
                    userId: userId,
                },
                include: {
                    DefaultPrompt: true,
                },
                orderBy: {
                    id: 'desc',
                },
                ...paginationParameters
            });
            for (let e = 0; e < sessions.length; e++) {
                const el = sessions[e];
                el.totalQuestions = await prisma.prompt.count({
                    where : {
                        sessionId : el.id,
                        type : PromptType.DEFAULT
                    }
                })
            }
            const numSessions = await prisma.session.count({
                where: {
                    userId: userId
                }
            });

            return {sessions: sessions, pagination: {...paginationParameters, total: numSessions}};
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    getSessionDetail: async (sessionId) => {
        try {
            const session = await prisma.session.findFirst({
                where: {
                    id: sessionId,
                },
                include: {
                    DefaultPrompt: {
                        include: {
                            mainParams: {
                                include: {
                                    Engine: true
                                }
                            },
                            explainMoreParams: {
                                include: {
                                    Engine: true
                                }
                            },
                            spellMoreParams: {
                                include: {
                                    Engine: true
                                }
                            },
                            funFactsParams: {
                                include: {
                                    Engine: true
                                }
                            },
                            metadataParams: {
                                include: {
                                    Engine: true
                                }
                            },
                        }
                    },
                },
            });

            return session;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    getSessionDetailWithPrompts: async (sessionId) => {
        try {
            const session = await prisma.session.findFirst({
                where: {
                    id: sessionId,
                },
                include: {
                    Prompts: {
                        where : {
                            type : {
                                not : PromptType.CUSTOM_TOKEN
                            }
                        }
                    },
                    DefaultPrompt: {
                        include: {
                            mainParams: {
                                include: {
                                    Engine: true
                                }
                            },
                            explainMoreParams: {
                                include: {
                                    Engine: true
                                }
                            },
                            spellMoreParams: {
                                include: {
                                    Engine: true
                                }
                            },
                            funFactsParams: {
                                include: {
                                    Engine: true
                                }
                            },
                        }

                    },
                },
            });

            return session;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

}

module.exports = sessionRepository;