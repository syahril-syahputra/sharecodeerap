const Sentry = require("@sentry/node");
const prisma = require("../lib-prisma");
const { PlanType, TrialPeriod } = require("@prisma/client");

const productRepository = {
    getAllProducts: async () => {
        try {
            const products = await prisma.product.findMany({
                include: {
                    Prices: true,
                },
            });
            return products;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getProductById: async (productId) => {
        try {
            const product = await prisma.product.findFirst({
                where: {
                    id: productId,
                },
            });

            return product;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    getDetailProductById: async (productId) => {
        try {
            const product = await prisma.product.findFirst({
                where: {
                    id: productId,
                },
                include: {
                    Prices: true,
                },
            });

            return product;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    getProductByStripeId: async (productId) => {
        try {
            const product = await prisma.product.findFirst({
                where: {
                    stripeId: productId,
                },
            });

            return product;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getAllPlan: async () => {
        try {
            const plan = await prisma.plan.findMany();

            return plan;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getFieldsType: async () => {
        try {
            return {
                PlanType,
                TrialPeriod,
            };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    postNewPlan: async (data) => {
        try {
            data.type = PlanType[data.type];
            data.TrialPeriod = TrialPeriod[data.TrialPeriod];
            const res = await prisma.plan.create({
                data,
            });

            return res;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    putPlan: async (id, data) => {
        try {
            if (data.type) data.type = PlanType[data.type];
            if (data.TrialPeriod)
                data.TrialPeriod = TrialPeriod[data.TrialPeriod];
            const res = await prisma.plan.update({
                where: {
                    id,
                },
                data,
            });

            return res;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    deletePlan: async (id) => {
        try {
            const find = await prisma.account.findMany({
                where: {
                    planId: id,
                },
            });

            if (find.length > 0) return null;
            else {
                return await prisma.plan.delete({
                    where: {
                        id,
                    },
                });
            }
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
};

module.exports = productRepository;
