const Sentry = require("@sentry/node");
const prisma = require("../../lib-prisma");
const priceRepository = require("../price-repository");
const priceAdminRepository = require("./price-repository");

const productRepository = {
    createProduct: async (product) => {
        try {
            let data = {
                stripeId: product.id,
                name: product.name,
                default_price: product.default_price,
                active: product.active,
                tokens: parseInt(product.metadata.tokens) || 500,
                created: new Date(product.created * 1000),
                updated: new Date(product.updated * 1000),
                description: product.description,
                livemode: product.livemode,
                tax_code: product.tax_code,
                type: product.type,
                url: product.url
            }
            let result = await prisma.product.create({
                data: data,
            });

            let price = await priceRepository.getPriceByStripeId(product.default_price);
            if(price){
                let data = {productId: result.id};
                await priceAdminRepository.editPrice(data, price.id);
            }

            return result;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    editProduct: async (data, productId) => {
        try {
            let product = await prisma.product.update({
                where: {
                    id: productId
                },
                data: data,
            });

            return product;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    deleteProduct: async (productId) => {
        try {
            const product = await prisma.product.delete({
                where: {
                    id: productId,
                }
            });

            return product;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    deleteProductByStripeId: async (productId) => {
        try {
            const product = await prisma.product.delete({
                where:{
                    stripeId: productId
                }
            });

            return product;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
}

module.exports = productRepository;