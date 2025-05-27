const express = require('express');
const {authAdmin} = require("../../libs/middleware/lib-auth");
const adminEngines = require("../../libs/controllers/admin/admin-waitlist");
module.exports = express.Router()

    .use(authAdmin)
    .post('/', async (req, res) => {
        await adminEngines.createWaitlist(req, res);
    })
    .post('/invite/:id', async (req, res) => {
        await adminEngines.invite(req, res);
    })
    .put('/:id', async (req, res) => {
        await adminEngines.editWaitlist(req, res);
    })
    .get('/', async (req, res) => {
        await adminEngines.getWaitlist(req, res);
    })
    .delete('/:id', async (req, res) => {
        await adminEngines.deleteWaitlist(req, res);
    })
;