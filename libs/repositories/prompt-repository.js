const Sentry = require("@sentry/node");
const prisma = require("../lib-prisma");
const { PromptType } = require("@prisma/client");
const contextPromptFormat = require("../helpers/context-format");

const sessionRepository = {
    createPrompt: async (data) => {
        try {
            let prompt = await prisma.prompt.create({
                data: data,
                include: {
                    Topic: true,
                    Quiz: {
                        include: {
                            QuizEntry: true,
                        },
                    },
                },
            });

            return prompt;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    getPromptsBySession: async (sessionId) => {
        try {
            let prompts = await prisma.prompt.findMany({
                where: {
                    sessionId: sessionId,
                },
            });

            return prompts;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getPromptsByReference: async (metadataToken) => {
        try {
            let prompts = await prisma.prompt.findFirst({
                where: {
                    metadataToken: metadataToken,
                },
                include: {
                    Context: true,
                    session: {
                        include: {
                            DefaultPrompt: {
                                include: {
                                    mainParams: true,
                                },
                            },
                        },
                    },
                },
            });
            if (prompts && !prompts?.session) {
                return prompts;
            } else {
                const filter = {
                    ...prompts,
                    max_tokens:
                        prompts?.session?.DefaultPrompt?.mainParams
                            ?.maxTokens ?? null,
                };

                delete filter?.session;

                return filter;
            }
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getPromptsById: async (id) => {
        try {
            let prompts = await prisma.prompt.findFirst({
                where: {
                    id,
                },
                include: {
                    DefaultPrompt: true,
                    session: {
                        include: {
                            DefaultPrompt: {
                                include: {
                                    mainParams: {
                                        include: {
                                            Engine: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });
            if(!prompts)
            {
                return prompts
            }

            let filter = {
                ...prompts,
                mainParams: prompts?.session?.DefaultPrompt?.mainParams,
            };
            delete filter?.session;
            return filter;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getPromptCustomToken: async (id) => {
        try {
            let prompts = await prisma.prompt.findMany({
                where: {
                    user: {
                        accountId: id,
                    },
                    type: PromptType.CUSTOM_TOKEN,
                },
            });

            return prompts
                .map((e) => e.totalTokens)
                .reduce((acc, curr) => acc + curr, 0);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    getLastUserPrompt: async (userId) => {
        try {
            const prompt = await prisma.prompt.findFirst({
                where: {
                    session: {
                        userId: userId,
                    },
                },
                include: {
                    session: true,
                },
                orderBy: [
                    {
                        id: "desc",
                    },
                ],
            });
            return prompt;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    getPromptsPaginated: async (userId, paginationParameters, type) => {
        try {
            let prompts = await prisma.prompt.findMany({
                where: {
                    userId: userId,
                    type: {
                        in: [type ?? "DEFAULT", "PREDEFINED_QUESTION"],
                    },
                },
                include: {
                    session: true,
                    funFacts: true,
                    relatedPrompts: true,
                    Context : true,
                },
                orderBy: [
                    {
                        id: "desc",
                    },
                ],
                ...paginationParameters,
            });

            prompts = prompts.map((obj) => {
                const { fullRequest, ...rest } = obj;
                return contextPromptFormat(rest);
            });

            const numPrompts = await prisma.prompt.count({
                where: {
                    session: {
                        userId: userId,
                    },
                },
            });

            return {
                prompts: prompts,
                pagination: { ...paginationParameters, total: numPrompts },
            };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    searchPrompts: async (userId, query) => {
        try {
            const prompts = await prisma.prompt.findMany({
                where: {
                    session: {
                        userId: userId,
                    },
                    response: {
                        contains: query,
                    },
                },
                include: {
                    session: true,
                },
                orderBy: [
                    {
                        id: "desc",
                    },
                ],
            });

            return { prompts: prompts };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    openAITokensSpentPerAccount: async (account, startDate, endDate) => {
        try {
            let result =
                await prisma.$queryRaw`SELECT SUM(\`totalTokens\`) as openAISpentTokens
                                                  from Prompt
                                                           left join User on
                                                      User.id = Prompt.userId
                                                           left join Account on
                                                      Account.id = User.accountId
                                                  WHERE Account.id = ${account}
                                                    and Prompt.createdAt between ${startDate} and ${endDate}
                                                    and Prompt.type not in ('CUSTOM_TOKEN')`;
            // console.log(customToken, 'customToken');
            // console.log(result[0], 'account result');

            if (!result) {
                return 0;
            } else {
                return result[0]?.openAISpentTokens ?? 0;
            }
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    charactersSentToGooglePerAccount: async (account, startDate, endDate) => {
        try {
            const result =
                await prisma.$queryRaw`select SUM(CHAR_LENGTH(\`response\`)) as charactersSent
                                                  from Prompt
                                                           left join User on
                                                      User.id = Prompt.userId
                                                           left join Account on
                                                      Account.id = User.accountId
                                                  WHERE Account.id = ${account}
                                                    and Prompt.createdAt between ${startDate} and ${endDate}`;

            if (!result) {
                return 0;
            } else {
                return result[0]?.charactersSent || 0;
            }
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    openAITokensSpentGlobally: async (startDate, endDate) => {
        try {
            const result =
                await prisma.$queryRaw`SELECT SUM(\`totalTokens\`) as openAISpentTokens
                                                  from Prompt
                                                           left join Session on
                                                      Session.id = Prompt.sessionId
                                                           left join User on
                                                      User.id = Session.userId
                                                  WHERE Prompt.createdAt between ${startDate} and ${endDate}`;

            if (!result) {
                return 0;
            } else {
                return result[0]?.openAISpentTokens || 0;
            }
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    charactersSentToGoogleGlobally: async (startDate, endDate) => {
        try {
            const result =
                await prisma.$queryRaw`select SUM(CHAR_LENGTH(\`response\`)) as charactersSent
                                                  from Prompt
                                                           left join Session on
                                                      Session.id = Prompt.sessionId
                                                           left join User on
                                                      User.id = Session.userId
                                                  WHERE Prompt.createdAt between ${startDate} and ${endDate}`;

            if (!result) {
                return 0;
            } else {
                return result[0]?.charactersSent || 0;
            }
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    deletePromptById: async (id) => {
        try {
            // const prompt = await prisma.prompt.deleteMany({
            //     where: {
            //         id: id
            //     },
            // });
            const dateDeletedAt = new Date();
            const prompt = await prisma.prompt.updateMany({
                where: {
                    id: id,
                },
                data: {
                    deleted: true,
                    deletedAt: dateDeletedAt,
                },
            });

            return prompt;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    reportPromptById: async (id) => {
        try {
            const report = await prisma.prompt.updateMany({
                where: {
                    id: id,
                },
                data: {
                    reported: true,
                    reportedAt: new Date(),
                },
            });

            return report;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    findPromptById: async (id) => {
        try {
            const prompt = await prisma.prompt.findFirst({
                where: {
                    id: id,
                },
                include: {
                    session: true,
                },
            });
            return prompt;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    countPromptsPerUser: async (userId) => {
        try {
            const num = await prisma.prompt.count({
                where: {
                    session: {
                        userId: userId,
                    },
                },
            });

            return num;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    findPromptByParentIdAndType: async (parentId, type) => {
        try {
            const prompt = await prisma.prompt.findFirst({
                where: {
                    promptParentId: parentId,
                    type: type,
                },
            });
            return prompt;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    manageUniqueTokenByType: async (prompt) => {
        try {
            if (prompt.type === PromptType.DEFAULT) {
                const related = await prisma.prompt.findFirst({
                    where: {
                        metadataToken: prompt.metadataToken,
                        type: PromptType.DEFAULT_METADATA,
                    },
                    orderBy: {
                        id: "desc",
                    },
                });
                // console.log(prompt.metadataToken, 'token metadata')
                // console.log(related, 'related')

                if (!related) {
                    return;
                }

                await prisma.prompt.update({
                    where: {
                        id: related.id,
                    },
                    data: {
                        promptParentId: prompt.id,
                        sessionId: prompt.sessionId,
                    },
                });
                return related;
            } else if (prompt.type === PromptType.DEFAULT_METADATA) {
                const related = await prisma.prompt.findFirst({
                    where: {
                        metadataToken: prompt.metadataToken,
                        type: PromptType.DEFAULT,
                    },
                    orderBy: {
                        id: "desc",
                    },
                });

                if (!related) {
                    return;
                }

                await prisma.prompt.update({
                    where: {
                        id: prompt.id,
                    },
                    data: {
                        promptParentId: related.id,
                        sessionId: related.sessionId,
                    },
                });

                return related;
            }
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    updateFollowStoryPrompt: async (id, request, response, fullRequest) => {
        try {
            const find = await prisma.prompt.findFirst({
                where: {
                    id,
                },
            });
            if (!find) return null;

            const prompt = await prisma.prompt.update({
                where: {
                    id: find.id,
                },
                data: {
                    request,
                    response,
                    fullRequest,
                },
            });

            return prompt;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    getLastNPrompts: async (userId, numberOfPrompts) => {
        try {
            let prompts = await prisma.prompt.findMany({
                where: {
                    userId: userId,
                    type: "DEFAULT",
                },
                take: numberOfPrompts,
                orderBy: [
                    {
                        id: "desc",
                    },
                ],
            });

            return prompts;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    getUserFinishedActivity: async (userId, activityId, type) => {
        const topics = await prisma.prompt.findMany({
            where: {
                userId: userId,
                Topic: {
                    activityId: activityId,
                },
                type: type,
            },
            distinct: ["topicId"],
        });

        return topics.length;
    },

    getUserFinishedTopic: async (userId, topicId, type) => {
        const prompt = await prisma.prompt.findFirst({
            where: {
                userId: userId,
                topicId: topicId,
                type: type,
            },
        });

        return prompt ? true : false;
    },

    getUserDefaultPrompt: async (userId) => {
        const prompts = await prisma.prompt.findMany({
            where: {},
        });

        return prompts;
    },

    promptsById: async (promptIds) => {
        const prompts = await prisma.prompt.findMany({
            where: {
                id: {
                    in: promptIds,
                },
            },
        });

        return prompts;
    },

    getLast20PromptsByUser: async (userId) => {
        try {
            const prompts = await prisma.prompt.findMany({
                where: {
                    userId: userId,
                    type: PromptType.DEFAULT,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: 20,
            });
            return prompts;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },


};

module.exports = sessionRepository;
