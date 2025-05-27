const express = require('express');
const {authAdmin} = require("../../libs/middleware/lib-auth");
const adminEngines = require("../../libs/controllers/admin/admin-poi-locations");
module.exports = express.Router()

    .use(authAdmin)
    .post('/', async (req, res) => {
        await adminEngines.createPoiLocation(req, res);
    })
    .put('/:id', async (req, res) => {
        await adminEngines.editPoiLocation(req, res);
    })
    .get('/', async (req, res) => {
        await adminEngines.getPoiLocations(req, res);
    })
    .delete('/:id', async (req, res) => {
        await adminEngines.deletePoiLocation(req, res);
    })
;