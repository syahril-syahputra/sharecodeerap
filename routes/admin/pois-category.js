const express = require('express');
const {authAdmin} = require("../../libs/middleware/lib-auth");
const adminEngines = require("../../libs/controllers/admin/admin-poi-categories");
module.exports = express.Router()

    .use(authAdmin)
    .post('/', async (req, res) => {
        await adminEngines.createPoiCategory(req, res);
    })
    .put('/:id', async (req, res) => {
        await adminEngines.editPoiCategory(req, res);
    })
    .get('/', async (req, res) => {
        await adminEngines.getPoiCategories(req, res);
    })
    .delete('/:id', async (req, res) => {
        await adminEngines.deletePoiCategory(req, res);
    })
;