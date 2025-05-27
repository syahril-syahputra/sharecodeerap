const Sentry = require("@sentry/node");
const prisma = require("../lib-prisma");

module.exports = sttRepository = {
    createRecord : async (reference, text, userId) => {
        try {
            const stt = await prisma.stt.create({
                data : {
                    reference,
                    text,
                    userId
                },
            });
            return stt;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getRecordByReferences : async (reference) => {
        try {
            const stt = await prisma.sTTRecord.findFirst({
                where : {
                    reference
                }
            });
            return stt;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    }
};
