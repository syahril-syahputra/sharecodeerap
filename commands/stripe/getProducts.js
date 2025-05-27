require('dotenv-safe').config({allowEmptyValues: true});

const stripeService = require("../../libs/service/stripeService");
const productAdminRepository = require("../../libs/repositories/admin/product-repository");

const getProductsAndSave = async () => {

    let products = await stripeService.getProducts();
    for (const product of products.data) {
        console.log(product)
        await productAdminRepository.createProduct(product);
    }

}
getProductsAndSave();