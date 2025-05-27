const Sentry = require("@sentry/node");
const prisma = require("../lib-prisma");

const priceRepository = {
    getAllPrices: async (paginationParameters) => {
        try {
            const prices = await prisma.price.findMany({
                ...paginationParameters
            });

            const numPrices = await prisma.price.count();

            return {prices: prices, pagination: {...paginationParameters, total: numPrices}};
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getPriceById: async (priceId) => {
        try {
            const price = await prisma.price.findFirst({
                where:{
                    id: priceId
                }
            });

            return price;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    getPriceByStripeId: async (priceId) => {
        try {
            const price = await prisma.price.findFirst({
                where:{
                    stripeId: priceId
                }
            });

            return price;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    }
}

module.exports = priceRepository;