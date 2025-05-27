const statuscodes = require('../helpers/statuscodes');
const { LogType } = require("@prisma/client")
const Sentry = require("@sentry/node");
const render = require('../helpers/render');
const {getAllProducts
} = require("../repositories/product-repository");
const logService = require("../service/logService");

const productController = {

    getProducts: async (req, res) => {
        try {
            let products = await getAllProducts();
                        
            render(res, 200, statuscodes.OK, products);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

}
module.exports = productController;


