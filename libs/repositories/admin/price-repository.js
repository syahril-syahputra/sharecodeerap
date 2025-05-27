const Sentry = require("@sentry/node");
const prisma = require("../../lib-prisma");
const productRepository = require("../product-repository");

const priceRepository = {
    createPrice: async (price) => {
        try {
            let data = {
                stripeId: price.id,
                currency: price.currency,
                unit_amount: price.unit_amount,
                productStripeId: price.product
            }
            let product = await productRepository.getProductByStripeId(price.product);
            if(product){
                data.productId = product.id;
            }

            let result = await prisma.price.create({
                data: data,
            });

            return result;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    editPrice: async (data, priceId) => {
        try {
            let price = await prisma.price.update({
                where: {
                    id: priceId
                },
                data: data,
            });

            return price;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    deletePrice: async (priceId) => {
        try {
            const price = await prisma.price.delete({
                where: {
                    id: priceId,
                }
            });

            return price;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
}

module.exports = priceRepository;