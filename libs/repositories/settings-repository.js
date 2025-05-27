const Sentry = require("@sentry/node");
const prisma = require("../lib-prisma");
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

    getStripeVisibilityForUser: async () => {
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
};
