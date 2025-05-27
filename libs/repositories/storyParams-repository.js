const Sentry = require("@sentry/node");
const prisma = require("../lib-prisma");

const storyParamsRepository = {
    getAll: async () => {
        try {
            const result = await prisma.storyParams.findMany();

            return result;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getTopicByStoryParams: async (storyParamId, userLevel) => {
        try {
            const topics = await prisma.storyParamsActivity.findMany({
                where: {
                    active: true,
                    storyParamId
                },
                include: {
                    Activity: {
                        include: {
                            Topic: {
                                where: {
                                    UserLevel: {
                                        points: {
                                            gte: 0,
                                            lte: userLevel.points,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });

            const result = topics.map((res) => {
                return res.Activity.Topic;
            });

            const randomizeResult = (arr) => {
                const newArray = [...arr]; // Create a copy of the array
                for (let i = newArray.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1)); // Generate a random index
                    [newArray[i], newArray[j]] = [newArray[j], newArray[i]]; // Swap elements
                }
                return newArray;
            };

            return randomizeResult(result[0]).slice(0, 4);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getStoryParamByIdIncludingTopic: async (data) => {
        try {
            //!
            const res = await prisma.storyParams.findFirst({
                where: {
                    id: data.id,
                },
                include: {
                    StoryParamsActivity: {
                        where: {
                            active: true,
                        },
                        include: {
                            Activity: {
                                include: {
                                    Topic: {
                                        where: {
                                            id: data.topicId,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });
            //!

            let result = {
                ...res,
                Topic: res.StoryParamsActivity[0].Activity.Topic[0],
            };
            delete result.StoryParamsActivity;

            return result;
        } catch (e) {
            console.error(e);
            // Sentry.captureException(e);
        }
    },
};

module.exports = storyParamsRepository;
