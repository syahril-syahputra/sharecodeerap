const { captureException } = require("@sentry/node");
const prisma = require("../../lib-prisma");
const { TypeOfTOS } = require("@prisma/client");

module.exports = {
    getAllTos: async (pagination) => {
        try {
            const res = await prisma.typeOfStory.findMany({
                include: {
                    Creator: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    StoryParamsType: {
                        where: {
                            active: true,
                        },
                        include: {
                            StoryParam: true,
                        },
                    },
                },
                ...pagination,
            });

            const typeOfStories = res.map((e) => {
                let data = {
                    ...e,
                    StoryParamsType: e.StoryParamsType.length
                        ? e.StoryParamsType
                        : null,
                };
                return data;
            });

            const total = await prisma.typeOfStory.count();

            return {
                typeOfStories,
                type: TypeOfTOS,
                pagination: {
                    ...pagination,
                    total,
                },
            };
        } catch (e) {
            console.error(e);
            captureException(e);
        }
    },
    createTos: async (data) => {
        try {
            const result = await prisma.typeOfStory.create({
                data,
            });

            return data;
        } catch (e) {
            console.error(e);
            captureException(e);
        }
    },
    updateTos: async (id, body) => {
        try {
            let data = {
                ...body,
                type: TypeOfTOS[body.type],
            };
            const resultUpdate = await prisma.typeOfStory.update({
                where: {
                    id,
                },
                data,
            });

            return resultUpdate;
        } catch (e) {
            console.error(e);
            captureException(e);
        }
    },
};
