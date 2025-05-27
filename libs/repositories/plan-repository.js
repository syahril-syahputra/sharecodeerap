const Sentry = require("@sentry/node");
const prisma = require("../lib-prisma");

const planRepository = {
    getAllPlan: async () => {
        try {
            const plans = await prisma.plan.findMany();
            return plans;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    getPlanById: async (planId) => {
        try {
            const plan = await prisma.plan.findFirst({
                where: {
                    id: planId,
                },
            });
            return plan;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getPlanBySubscriptionId : async (subscriptionId) => {
        try {
            const plan = await prisma.plan.findFirst({
                where: {
                    identifier : subscriptionId
                }
            })
            return plan
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    }
}

module.exports = planRepository;