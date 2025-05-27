const express = require('express');

const { authAdmin } = require('../../libs/middleware/lib-auth');
const adminUser = require("../../libs/controllers/admin/admin-users");

module.exports = express.Router()

	.use(authAdmin)
    .get('/:id', async (req, res) => {
        await adminUser.getUserDetail(req, res);
    })
    .delete('/:id', async (req, res) => {
        await adminUser.deleteUser(req, res);
    })
    .put('/verified/:id', async (req, res) => {
        await adminUser.setVerified(req, res);
    })
    .put('/levels/:id', async (req, res) => {
        await adminUser.updateLevel(req, res);
    })
    .put('/points/:id', async (req, res) => {
        await adminUser.updatePoints(req, res);
    })
    .post('/generate-interests/:id', async (req, res) => {
        await adminUser.generateInterests(req, res);
    })
;

