const express = require('express');
const {authAdmin} = require("../../libs/middleware/lib-auth");
const adminPoiController = require("../../libs/controllers/admin/admin-pois");
module.exports = express.Router()
    .use(authAdmin)
    .post('/', async (req, res) => {
        await adminPoiController.createPoi(req, res);
    })
    .post('/generate', async (req, res) => {
        await adminPoiController.generatePois(req, res);
    })
    .post('/validate/:id', async (req, res) => {
        await adminPoiController.validatePoi(req, res);
    })
    .post('/geocode', async (req, res) => {
        await adminPoiController.geocode(req, res);
    })
    .post('/invalidate/:id', async (req, res) => {
        await adminPoiController.invalidatePoi(req, res);
    })
    .put('/:id', async (req, res) => {
        await adminPoiController.editPoi(req, res);
    })
    .get('/', async (req, res) => {
        await adminPoiController.getPois(req, res);
    })
    .delete('/:id', async (req, res) => {
        await adminPoiController.deletePoi(req, res);
    })
;