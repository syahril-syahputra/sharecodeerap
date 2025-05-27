const express = require('express');

const { authAdmin } = require('../../libs/middleware/lib-auth');
const adminSocials = require("../../libs/controllers/admin/admin-socials");

module.exports = express.Router()

	.use(authAdmin)
    .post('/', async (req, res) => {
        await adminSocials.createSocial(req, res);
    })
    .put('/:id', async (req, res) => {
        await adminSocials.editSocial(req, res);
    })
    .get('/', async (req, res) => {
        await adminSocials.getSocials(req, res);
    })
    .delete('/:id', async (req, res) => {
        await adminSocials.deleteSocial(req, res);
    })
;

