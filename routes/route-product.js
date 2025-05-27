const express = require('express');
const productController = require("../libs/controllers/product");
const { auth } = require('../libs/middleware/lib-auth');
module.exports = express.Router()

    .get('/', async (req, res) => {
        await productController.getProducts(req, res);
    })

;