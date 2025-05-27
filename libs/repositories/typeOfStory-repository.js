const prisma = require("../lib-prisma");
const Sentry = require("@sentry/node");

module.exports = {
    getAllType: async () => {
        try {
            const result = await prisma.typeOfStory.findMany();

            return result;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getDetailType: async (id, userLevel) => {
        try {
            const count = await prisma.typeOfStory.count({
                where : {
                    id
                }
            })
            if(!count) return null;
            const result = await prisma.typeOfStory.findFirst({
                where: {
                    id,
                },
                include: {
                    StoryParamsType: {
                        where: {
                            active: true,
                        },
                        include: {
                            StoryParam: {
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
                                    },
                                },
                            },
                        },
                    },
                },
            });

            const filter = {
                ...result,
                StoryParam: result.StoryParamsType.map((e) => {
                    let data = {
                        ...e.StoryParam,
                        Topic: e.StoryParam.StoryParamsActivity.map((e) => {
                            return e.Activity.Topic;
                        }),
                    };
                    data.Topic = [...data.Topic[0]];
                    delete data.StoryParamsActivity;
                    return data;
                }),
            };
            delete filter.StoryParamsType;

            return filter;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getTosById: async (id) => {
        try {
            const tos = await prisma.typeOfStory.findFirst({
                where: {
                    id,
                },
            });

            return tos;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getRandomizedTypeOfStory: async (userLevel) => {
        try {
            const tos = await prisma.typeOfStory.findMany({
                include: {
                    StoryParamsType: {
                        where: {
                            active: true,
                        },
                        include: {
                            StoryParam: {
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
                                    },
                                },
                            },
                        },
                    },
                },
            });

            const randomizeResult = (arr) => {
                const newArray = [...arr]; // Create a copy of the array
                for (let i = newArray.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1)); // Generate a random index
                    [newArray[i], newArray[j]] = [newArray[j], newArray[i]]; // Swap elements
                }
                return newArray;
            };
            const get = randomizeResult(tos)[0];
            const filter = {
                ...get,
                StoryParam: get.StoryParamsType.map((e) => {
                    const { StoryParam } = e;
                    const { StoryParamsActivity } = StoryParam;
                    let data = {
                        ...StoryParam,
                        Topic: StoryParamsActivity.map((e) => {
                            return randomizeResult(e.Activity.Topic)[0];
                        })[0],
                    };
                    delete data.StoryParamsActivity;
                    return data;
                }),
            };

            delete filter.StoryParamsType;

            return filter;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
};
