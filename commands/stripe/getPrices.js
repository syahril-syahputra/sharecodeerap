require('dotenv-safe').config({allowEmptyValues: true});

const stripeService = require("../../libs/service/stripeService");
const productAdminRepository = require("../../libs/repositories/admin/product-repository");
const priceAdminRepository = require("../../libs/repositories/admin/price-repository");
const productRepository = require("../../libs/repositories/product-repository");

const getPricesAndSave = async () => {

    let prices = await stripeService.getPrices();
    for (const price of prices.data) {
        let p = await priceAdminRepository.createPrice(price);
        console.log(p)
    }

}
getPricesAndSave();