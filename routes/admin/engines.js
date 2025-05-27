const express = require('express');
const {authAdmin} = require("../../libs/middleware/lib-auth");
const adminEngines = require("../../libs/controllers/admin/admin-engines");
module.exports = express.Router()

    .use(authAdmin)
    .post('/', async (req, res) => {
        await adminEngines.createEngine(req, res);
    })
    .put('/:id', async (req, res) => {
        await adminEngines.editEngine(req, res);
    })
    .get('/', async (req, res) => {
        await adminEngines.getEngines(req, res);
    })
    .delete('/:id', async (req, res) => {
        await adminEngines.deleteEngine(req, res);
    })

;