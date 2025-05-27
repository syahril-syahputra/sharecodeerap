const Sentry = require("@sentry/node");
const prisma = require("../../lib-prisma");

const funFactRepository = {
    getPromptFunFact: async (promptId) => {
        try {
            const funfact = await prisma.funFact.findMany({
                where : {
                    promptId : promptId
                }
            })
            return funfact;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
};

module.exports = funFactRepository;
