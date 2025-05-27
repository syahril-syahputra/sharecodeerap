const Sentry = require("@sentry/node");
const stripe = require('stripe')(process.env.STRIPE_SK);

const stripeService = {

    getProducts: async () => {
        try {
            const products = await stripe.products.list({
                limit: 100,
            });

            return products;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    getPrices: async () => {
        try {
            const prices = await stripe.prices.list({
                limit: 100,
            });

            return prices;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    cancelSubscription: async (subscriptionId) => {
        try {
            const status = await stripe.subscriptions.cancel(subscriptionId);
            return status;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

}
module.exports = stripeService;
