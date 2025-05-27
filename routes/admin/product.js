const express = require('express');
const productController = require("../../libs/controllers/admin/product");
const { authAdmin} = require('../../libs/middleware/lib-auth');
module.exports = express.Router()

    .use(authAdmin)
    .get('/', async (req, res) => {
        await productController.getProducts(req, res);
    })

;