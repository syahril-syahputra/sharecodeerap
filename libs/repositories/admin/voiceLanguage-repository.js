const Sentry = require("@sentry/node");
const prisma = require("../../lib-prisma");

const voiceLanguageRepository = {
    getAll: async () => {
        try {
            const voice = await prisma.voiceLanguage.findMany();

            return voice;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getAllByLanguage: async (language) => {
        try {
            const voice = await prisma.voiceLanguage.findMany({
                where: {
                    language_code: language,
                },
            });
            return voice;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    updateVoiceLanguage: async (data, id) => {
        try {
            if (data.default === true) {
                const updateManyVoice = await prisma.voiceLanguage.updateMany({
                    where: {
                        NOT: {
                            id,
                        },
                        language_code: data.language_code,
                    },
                    data: {
                        default: false,
                    },
                });

                console.log(
                    updateManyVoice,
                    "Updated other Language into false"
                );
            }
            const update = await prisma.voiceLanguage.update({
                where: {
                    id,
                },
                data,
            });

            return update;
        } catch (e) {
            Sentry.captureException(e);
            console.error(e);
        }
    },
    createVoiceLanguage: async (data) => {
        try {
            const create = await prisma.voiceLanguage.create({
                data,
            });

            if (create.default) {
                const updateOthers = await prisma.voiceLanguage.updateMany({
                    where: {
                        NOT: {
                            id: create.id,
                        },
                        language_code: data.language_code,
                    },
                    data: {
                        default: false,
                    },
                });
            }

            return create;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    deleteVoiceLanguage: async (id) => {
        try {
            const deleteVoice = await prisma.voiceLanguage.delete({
                where: {
                    id,
                },
            });

            return deleteVoice;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getVoiceTTSModel: async () => {
        try {
            return await prisma.openAiTTSModel.findMany();
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    useOpenAiTTSModel: async (id) => {
        try {
            const up = await prisma.openAiTTSModel.updateMany({
                data: {
                    inUse: false,
                },
            });

            const update = await prisma.openAiTTSModel.update({
                where : {
                    id
                },
                data : {
                    inUse : true
                }
            })

            return update;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
};

module.exports = { ...voiceLanguageRepository };
