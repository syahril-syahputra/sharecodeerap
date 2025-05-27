const Sentry = require("@sentry/node");
const prisma = require("../../lib-prisma");
const {
    PromptType
} = require("@prisma/client");

const promptRepository = {
    getPromptsPaginated: async (sessionId, paginationParameters, type = null) => {
        try {
            const prompts = await prisma.prompt.findMany({
                where: {
                    sessionId: sessionId,
                    type: type ?? PromptType.DEFAULT,
                },
                include: {
                    DefaultPrompt: {
                        include: {
                            customStoryParams: true,
                            explainMoreParams: true,
                            funFactsParams: true,
                            mainParams: true,
                            metadataParams: true,
                            quizExplainMoreParams: true,
                            quizParams: true,
                            spellMoreParams: true,
                            storyParams: true,
                            factParams: true,
                            IdleParams: true,
                            OpenAIParams: true,
                        },
                    },
                    relatedPrompts: true
                },
                ...paginationParameters,
            });

            const numPrompts = await prisma.prompt.count({
                where: {
                    sessionId: sessionId,
                    type: type ?? PromptType.DEFAULT
                },
            });

            return {
                prompts: prompts,
                pagination: {
                    ...paginationParameters,
                    total: numPrompts
                },
            };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getFactsPaginated: async (userId, paginationParameters, search) => {
        try {
            const prompts = await prisma.prompt.findMany({
                ...(search ?
                    {
                        where: {
                            userId: userId,
                            type: PromptType.FACT,
                            Topic: {
                                OR: [{
                                        name: {
                                            contains: search,
                                        },
                                    },
                                    {
                                        name_cn: {
                                            contains: search,
                                        },
                                    },
                                    {
                                        name_ct: {
                                            contains: search,
                                        },
                                    },
                                    {
                                        name_fr: {
                                            contains: search,
                                        },
                                    },
                                    {
                                        name_es: {
                                            contains: search,
                                        },
                                    },
                                    {
                                        name_id: {
                                            contains: search,
                                        },
                                    },
                                ],
                            },
                        },
                    } :
                    {
                        where: {
                            userId: userId,
                            type: PromptType.FACT,
                        },
                    }),
                include: {
                    Topic: true,
                },
                ...paginationParameters,
            });

            const numPrompts = await prisma.prompt.count({
                ...(search ?
                    {
                        where: {
                            userId: userId,
                            type: PromptType.FACT,
                            Topic: {
                                OR: [{
                                        name: {
                                            contains: search,
                                        },
                                    },
                                    {
                                        name_cn: {
                                            contains: search,
                                        },
                                    },
                                    {
                                        name_ct: {
                                            contains: search,
                                        },
                                    },
                                    {
                                        name_fr: {
                                            contains: search,
                                        },
                                    },
                                    {
                                        name_es: {
                                            contains: search,
                                        },
                                    },
                                    {
                                        name_id: {
                                            contains: search,
                                        },
                                    },
                                ],
                            },
                        },
                    } :
                    {
                        where: {
                            userId: userId,
                            type: PromptType.FACT,
                        },
                    }),
            });

            return {
                facts: prompts,
                pagination: {
                    ...paginationParameters,
                    total: numPrompts
                },
            };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getStoriesPaginated: async (userId, paginationParameters, search) => {
        try {
            // console.log(search);
            let prompts = await prisma.prompt.findMany({
                ...(search ?
                    {
                        where: {
                            userId: userId,
                            type: PromptType.STORY,
                            Topic: {
                                OR: [{
                                        name: {
                                            contains: search,
                                        },
                                    },
                                    {
                                        name_cn: {
                                            contains: search,
                                        },
                                    },
                                    {
                                        name_ct: {
                                            contains: search,
                                        },
                                    },
                                    {
                                        name_fr: {
                                            contains: search,
                                        },
                                    },
                                    {
                                        name_es: {
                                            contains: search,
                                        },
                                    },
                                    {
                                        name_id: {
                                            contains: search,
                                        },
                                    },
                                ],
                            },
                        },
                    } :
                    {
                        where: {
                            userId: userId,
                            type: PromptType.STORY,
                        },
                    }),
                include: {
                    DefaultPrompt: {
                        include: {
                            storyParams: {
                                include: {
                                    Engine: true,
                                },
                            },
                        },
                    },
                },
                orderBy: [{
                    id: "desc",
                }, ],
                ...paginationParameters,
            });

            const numPrompts = await prisma.prompt.count({
                ...(search ?
                    {
                        where: {
                            userId: userId,
                            type: PromptType.STORY,
                            Topic: {
                                OR: [{
                                        name: {
                                            contains: search,
                                        },
                                    },
                                    {
                                        name_cn: {
                                            contains: search,
                                        },
                                    },
                                    {
                                        name_ct: {
                                            contains: search,
                                        },
                                    },
                                    {
                                        name_fr: {
                                            contains: search,
                                        },
                                    },
                                    {
                                        name_es: {
                                            contains: search,
                                        },
                                    },
                                    {
                                        name_id: {
                                            contains: search,
                                        },
                                    },
                                ],
                            },
                        },
                    } :
                    {
                        where: {
                            userId: userId,
                            type: PromptType.STORY,
                        },
                    }),
            });

            return {
                stories: prompts,
                pagination: {
                    ...paginationParameters,
                    total: numPrompts
                },
            };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getResponseTimeInTimeRangeByLLM: async (start, end, type, engine) => {
        try {
            const result = await prisma.prompt.aggregate({
                _avg: {
                    responseTime: true,
                },
                where: {
                    createdAt: {
                        gte: start,
                        lte: end,
                    },
                    llmEngine: engine,
                    type: type,
                },
            });

            const averageValue = result._avg.responseTime ?? null;
            return averageValue;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getResponseTimeInTimeRangeBySTT: async (start, end, type, engine) => {
        try {
            const result = await prisma.prompt.aggregate({
                _avg: {
                    responseTime: true,
                },
                where: {
                    createdAt: {
                        gte: start,
                        lte: end,
                    },
                    sttEngine: engine,
                    type: type,
                },
            });

            const averageValue = result._avg.responseTime ?? null;
            return averageValue;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getResponseTimeInTimeRangeByTTS: async (start, end, type, engine) => {
        try {
            const result = await prisma.prompt.aggregate({
                _avg: {
                    responseTime: true,
                },
                where: {
                    createdAt: {
                        gte: start,
                        lte: end,
                    },
                    ttsEngine: engine,
                    type: type,
                },
            });

            const averageValue = result._avg.responseTime ?? null;
            return averageValue;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getResponseTimeInTimeRange: async (start, end, type) => {
        try {
            const result = await prisma.prompt.aggregate({
                _avg: {
                    responseTime: true,
                },
                where: {
                    createdAt: {
                        gte: start,
                        lte: end,
                    },
                    type: type,
                },
            });

            const averageValue = result._avg.responseTime ?? null;

            return averageValue;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getDallePromptPaginated: async (userId, paginationParameters, search) => {
        try {
            let prompts = await prisma.prompt.findMany({
                ...(search ?
                    {
                        where: {
                            userId: userId,
                            type: PromptType.DALLE,
                            Topic: {
                                OR: [{
                                        name: {
                                            contains: search,
                                        },
                                    },
                                    {
                                        name_cn: {
                                            contains: search,
                                        },
                                    },
                                    {
                                        name_ct: {
                                            contains: search,
                                        },
                                    },
                                    {
                                        name_fr: {
                                            contains: search,
                                        },
                                    },
                                    {
                                        name_es: {
                                            contains: search,
                                        },
                                    },
                                    {
                                        name_id: {
                                            contains: search,
                                        },
                                    },
                                ],
                            },
                        },
                    } :
                    {
                        where: {
                            userId: userId,
                            type: PromptType.DALLE,
                        },
                    }),
                include: {
                    DefaultPrompt: {
                        include: {
                            storyParams: {
                                include: {
                                    Engine: true,
                                },
                            },
                        },
                    },
                },
                orderBy: [{
                    id: "desc",
                }, ],
                ...paginationParameters,
            });

            const numPrompts = await prisma.prompt.count({
                ...(search ?
                    {
                        where: {
                            userId: userId,
                            type: PromptType.DALLE,
                            Topic: {
                                OR: [{
                                        name: {
                                            contains: search,
                                        },
                                    },
                                    {
                                        name_cn: {
                                            contains: search,
                                        },
                                    },
                                    {
                                        name_ct: {
                                            contains: search,
                                        },
                                    },
                                    {
                                        name_fr: {
                                            contains: search,
                                        },
                                    },
                                    {
                                        name_es: {
                                            contains: search,
                                        },
                                    },
                                    {
                                        name_id: {
                                            contains: search,
                                        },
                                    },
                                ],
                            },
                        },
                    } :
                    {
                        where: {
                            userId: userId,
                            type: PromptType.DALLE,
                        },
                    }),
            });

            return {
                dalle: prompts,
                pagination: {
                    ...paginationParameters,
                    total: numPrompts
                },
            };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getQuizExplainMoreDB: async (userId, paginationParameters, search) => {
        try {
            // console.log(search);
            const prompts = await prisma.prompt.findMany({
                ...(search ?
                    {
                        where: {
                            userId: userId,
                            type: PromptType.QUIZ_EXPLAIN_MORE,
                            Topic: {
                                OR: [{
                                        name: {
                                            contains: search,
                                        },
                                    },
                                    {
                                        name_cn: {
                                            contains: search,
                                        },
                                    },
                                    {
                                        name_ct: {
                                            contains: search,
                                        },
                                    },
                                    {
                                        name_fr: {
                                            contains: search,
                                        },
                                    },
                                    {
                                        name_es: {
                                            contains: search,
                                        },
                                    },
                                    {
                                        name_id: {
                                            contains: search,
                                        },
                                    },
                                ],
                            },
                        },
                    } :
                    {
                        where: {
                            userId: userId,
                            type: PromptType.QUIZ_EXPLAIN_MORE,
                        },
                    }),
                include: {
                    quizEntry: true,
                },
                orderBy: [{
                    id: "desc",
                }, ],
                ...paginationParameters,
            });

            const numPrompts = await prisma.prompt.count({
                ...(search ?
                    {
                        where: {
                            userId: userId,
                            type: PromptType.QUIZ_EXPLAIN_MORE,
                            Topic: {
                                OR: [{
                                        name: {
                                            contains: search,
                                        },
                                    },
                                    {
                                        name_cn: {
                                            contains: search,
                                        },
                                    },
                                    {
                                        name_ct: {
                                            contains: search,
                                        },
                                    },
                                    {
                                        name_fr: {
                                            contains: search,
                                        },
                                    },
                                    {
                                        name_es: {
                                            contains: search,
                                        },
                                    },
                                    {
                                        name_id: {
                                            contains: search,
                                        },
                                    },
                                ],
                            },
                        },
                    } :
                    {
                        where: {
                            userId: userId,
                            type: PromptType.QUIZ_EXPLAIN_MORE,
                        },
                    }),
            });

            return {
                queries: prompts,
                pagination: {
                    ...paginationParameters,
                    total: numPrompts
                },
            };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getPromptsAssistantPaginated: async (userId, paginationParameters) => {
        try {
            const prompts = await prisma.prompt.findMany({
                where: {
                    userId: parseInt(userId),
                    type: PromptType.DEFAULT,
                    sessionId: null
                },
                ...paginationParameters,
            });

            const numPrompts = await prisma.prompt.count({
                where: {
                    userId: parseInt(userId),
                    type: PromptType.DEFAULT,
                    sessionId: null
                },
            });

            return {
                prompts: prompts,
                pagination: {
                    ...paginationParameters,
                    total: numPrompts
                },
            };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    getPromptsByUserAndInterval: async (userId, startDate, endDate) => {
        try {
            const prompts = await prisma.prompt.findMany({
                where: {
                    userId: userId,
                    createdAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                    type: PromptType.DEFAULT,
                },
                include: {
                    session: true,  // Include related session data if needed
                },
                orderBy: {
                    createdAt: 'asc',
                },
            });
            return prompts;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            return []; // Return an empty array to handle errors gracefully
        }
    },
};

module.exports = promptRepository;