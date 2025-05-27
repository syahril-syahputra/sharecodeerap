const express = require('express');

const { authAdmin } = require('../../libs/middleware/lib-auth');
const adminCountries = require("../../libs/controllers/admin/admin-countries");

module.exports = express.Router()

	.use(authAdmin)
    .get('/', async (req, res) => {
        await adminCountries.getCountries(req, res);
    })

;

