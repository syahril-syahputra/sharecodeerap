const express = require('express');
const {authAdmin} = require("../../libs/middleware/lib-auth");
const adminEngines = require("../../libs/controllers/admin/admin-invite-link");
module.exports = express.Router()

    .use(authAdmin)
    .post('/', async (req, res) => {
        await adminEngines.createInviteLink(req, res);
    })
    .put('/:id', async (req, res) => {
        await adminEngines.editInviteLink(req, res);
    })
    .get('/', async (req, res) => {
        await adminEngines.getInviteLink(req, res);
    })
    .delete('/:id', async (req, res) => {
        await adminEngines.deleteInviteLink(req, res);
    })
;