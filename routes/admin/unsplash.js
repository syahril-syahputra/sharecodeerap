const express = require('express');
const {authAdmin} = require("../../libs/middleware/lib-auth");
const adminEngines = require("../../libs/controllers/admin/admin-unsplash");
module.exports = express.Router()

    .use(authAdmin)
    .get('/images', async (req, res) => {
        await adminEngines.getImages(req, res);
    })
;