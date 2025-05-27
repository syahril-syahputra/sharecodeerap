const Sentry = require("@sentry/node");
const prisma = require("../lib-prisma");

module.exports = {
    fetchAllSavedStories: async (req) => {
        try {
            const result = await prisma.savedStory.findMany({
                where: {
                    userId: req.user.id,
                },
                include: {
                    Prompt: {
                        select: {
                            id: true,
                            createdAt: true,
                            request: true,
                            response: true,
                        },
                    },
                    TypeOfStory: true,
                    SavedStoryParamsTopic: {
                        include: {
                            StoryParam: true,
                            Topic: true,
                        },
                    },
                },
            });

            const filter = result.map((e) => {
                const data = {
                    ...e,
                    StoryParams: e.SavedStoryParamsTopic.map(
                        (e) => e.StoryParam
                    ),
                    Topic: e.SavedStoryParamsTopic.map((e) => e.Topic),
                };
                delete data.SavedStoryParamsTopic;
                return data;
            });

            return filter;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getOneSavedStory: async (req, id) => {
        try {
            const story = await prisma.savedStory.findFirst({
                where: {
                    id,
                    userId: req.user.id,
                },
                include: {
                    Prompt: true,
                    TypeOfStory: true,
                    SavedStoryParamsTopic: {
                        include: {
                            StoryParam: true,
                            Topic: true,
                        },
                    },
                    ContinousSavedStory: {
                        include: {
                            Prompt: true,
                        },
                    },
                },
            });

            let result = {
                ...story,
                StoryParams: story.SavedStoryParamsTopic.map(
                    (e) => e.StoryParam
                ),
                FollowStory: story.ContinousSavedStory.map((e) => {
                    let res = {
                        ...e.Prompt,
                    };
                    delete res.fullRequest;
                    return res;
                }),
                Topic: story.SavedStoryParamsTopic.map((e) => e.Topic),
            };
            delete result.ContinousSavedStory;
            delete result.SavedStoryParamsTopic;

            return result;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    destroySavedStory: async (id, userId) => {
        try {
            const find = await prisma.savedStory.findFirst({
                where: {
                    id,
                },
            });
            
            if (!find) return null;
            if(find.id !== userId) return null;

            const deleteStory = await prisma.savedStory.delete({
                where: {
                    id,
                },
            });

            return { deleteStory };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    addNewSavedStory: async (data, params) => {
        try {
            if (!params.length) return false;

            const savedStory = await prisma.savedStory.create({
                data,
            });
            const { id: savedStoryId } = savedStory;
            const dataParams = params.map((e) => {
                return {
                    storyParamId: e.id,
                    savedStoryId,
                    topicId: e.Topic.id,
                };
            });

            const savedStoryParams =
                await prisma.savedStoryParamsTopic.createMany({
                    data: dataParams,
                });

            return {
                savedStory,
                savedStoryParams,
            };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
};
