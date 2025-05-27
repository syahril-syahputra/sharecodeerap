const Sentry = require("@sentry/node");
const prisma = require("../../lib-prisma");

const system_promptRepository = {
    createSystemPromptDB: async (data) => {
        try {
            let system_prompt = await prisma.systemPrompt.create({
                data: data,
            });

            return system_prompt;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    editSystemPromptDB: async (data, system_promptId) => {
        try {
            let system_prompt = await prisma.systemPrompt.update({
                where: {
                  id: system_promptId
                },
                data: data,
                include: {
                    Engine: true
                }
            });

            return system_prompt;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getAllSystemPrompts: async () => {
        try {
            const systemprompts = await prisma.systemPrompt.findMany({
                include: {
                    Engine: true
                }
            });

            return systemprompts;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getSystemPromptsById: async (id) => {
        try {
            const systemprompts = await prisma.systemPrompt.findFirst({
                where:{
                    id : id
                },
                include: {
                    Engine: true
                }
            });

            return systemprompts;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getPromptByType: async (type) => {
        try {
            const systemprompts = await prisma.systemPrompt.findUnique({
                where: {
                    type: type
                },
                include: {
                    Engine: true
                }
            });

            return systemprompts;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    deleteSystemPromptDB: async (system_promptId) => {
        try {
            const systemprompts = await prisma.systemPrompt.delete({
                where: {
                    id: system_promptId,
                }
            });

            return systemprompts;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
}

module.exports = system_promptRepository;