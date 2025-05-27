const Sentry = require("@sentry/node");
const prisma = require("../lib-prisma");

const onboardingEmailRepository = {
    getEmails: async () => {
        try {
            const emails = await prisma.onboardingEmails.findMany();
            return emails;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    addEmail: async (email) => {
        try {
            const objEmail = await prisma.onboardingEmails.create({
                data: {
                    email,
                },
            });
            return objEmail;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
};

module.exports = onboardingEmailRepository;
