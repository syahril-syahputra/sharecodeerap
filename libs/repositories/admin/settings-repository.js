const Sentry = require("@sentry/node");
const prisma = require("../../lib-prisma");

module.exports = {

    getSettings: async () => {
        try {
            const settings = await prisma.settings.findMany({
            });
            return settings;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    getSettingByName: async (name) => {
        try {
            const settings = await prisma.settings.findFirst({
                where: {
                    name: name
                }
            });
            return settings;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    getStripeVisibility: async () => {
        try {
            const stripe = await prisma.settings.findFirst({
                where: {
                    name: "StripeVisibility",
                },
            });
            return stripe;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    setStripeVisibility: async (value) => {
        try {
            const { id } = await prisma.settings.findFirst({
                where : {
                    name : "StripeVisibility"
                }
            });
            const updateVisibility = await prisma.settings.update({
                where : {
                    id
                },
                data : {
                    status : value
                }
            });
            return updateVisibility;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    setTTS: async (value, voice, model) => {
        try {
            const setting = await prisma.settings.updateMany({
                where : {
                    name : "TTS"
                },
                data : {
                    ttsType : value,
                    voice: voice,
                    model: model
                }
            });
            return setting;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    setTTSVoice: async (value) => {
        try {
            const setting = await prisma.settings.updateMany({
                where : {
                    name : "TTS"
                },
                data : {
                    voice : value
                }
            });
            return setting;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    setTTSModel: async (value) => {
        try {
            const setting = await prisma.settings.updateMany({
                where : {
                    name : "TTS"
                },
                data : {
                    model : value
                }
            });
            return setting;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    setSTT: async (value) => {
        try {
            const setting = await prisma.settings.updateMany({
                where : {
                    name : "STT"
                },
                data : {
                    sttType : value
                }
            });
            return setting;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
};
