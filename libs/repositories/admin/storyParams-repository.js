const Sentry = require("@sentry/node");
const prisma = require("../../lib-prisma");
const { TypeOfStoryparam } = require("@prisma/client");

const adminStoryParamsRepository = {
    fetchStoryParams: async (pagination) => {
        try {
            const storyParams = await prisma.storyParams.findMany({
                ...pagination,
            });
            const total = await prisma.storyParams.count();
            return {
                storyParams,
                type: TypeOfStoryparam,
                pagination: { ...pagination, total },
            };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    createStoryParams: async (data) => {
        try {
            const create = await prisma.storyParams.create({
                data,
            });
            return create;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    updateStoryParams: async (id, body) => {
        try {
            const data = {
                ...body,
                type: TypeOfStoryparam[body.type],
            };
            const update = await prisma.storyParams.update({
                where: {
                    id,
                },
                data,
            });

            return update;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    deleteStory: async (id) => {
        try {
            const update = await prisma.storyParams.delete({
                where: {
                    id,
                },
            });

            return update;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getAllParams: async (id) => {
        try {
            const storyParams = await prisma.storyParams.findMany({
                include: {
                    StoryParamsActivity: {
                        where: {
                            activityId: id,
                        },
                    },
                },
            });

            const result = storyParams.map((e) => {
                let data = {
                    ...e,
                    StoryParamsActivity: e.StoryParamsActivity[0]
                        ? e.StoryParamsActivity[0]
                        : null,
                };
                return data;
            });
            return result;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    updateStoryParamTOS: async (id, data) => {
        try {
            let result;
            const res = await prisma.storyParamsType.findFirst({
                where: {
                    typeOfStoryId: parseInt(id),
                    storyParamId: data.storyParamId,
                },
            });
            if (res) {
                result = await prisma.storyParamsType.update({
                    where: {
                        id: res.id,
                    },
                    data: {
                        active: data.active,
                    },
                });
            } else {
                result = await prisma.storyParamsType.create({
                    data: {
                        storyParamId: data.storyParamId,
                        typeOfStoryId: parseInt(id),
                        active: data.active,
                    },
                });
            }
            return result;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getTosByParamId: async (id) => {
        try {
            const res = await prisma.storyParams.findMany({
                include: {
                    StoryParamsType: {
                        where: {
                            typeOfStoryId: id,
                        },
                    },
                },
            });

            const result = res.map((e) => {
                let data = {
                    ...e,
                    StoryParamsType: e.StoryParamsType[0]
                        ? e.StoryParamsType[0]
                        : null,
                };

                return data;
            });

            return result;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    updateStatusActivityParam: async (id, data) => {
        try {
            const find = await prisma.storyParamsActivity.findFirst({
                where: {
                    storyParamId: data.storyParamId,
                    activityId: id,
                },
            });

            if (find) {
                return await prisma.storyParamsActivity.update({
                    where: {
                        id: find.id,
                    },
                    data,
                });
            }

            return await prisma.storyParamsActivity.create({
                data: {
                    activityId: id,
                    ...data,
                },
            });
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
};

module.exports = adminStoryParamsRepository;
