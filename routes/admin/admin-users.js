const express = require('express');

const { authAdmin } = require('../../libs/middleware/lib-auth');
const adminUser = require("../../libs/controllers/admin/admin-admin-users");

module.exports = express.Router()

	.use(authAdmin)
    .get('/', async (req, res) => {
        await adminUser.listAdminUsers(req, res);
    })
    .get('/:id', async (req, res) => {
        await adminUser.getAdminUserDetail(req, res);
    })
    .post('/', async (req, res) => {
        await adminUser.createAdminUser(req, res);
    })
    .delete('/:id', async (req, res) => {
        await adminUser.deleteAdminUser(req, res);
    })
    .put('/:id', async (req, res) => {
        await adminUser.updateAdminUser(req, res);
    })
;

