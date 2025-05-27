const express = require('express');

const { authAdmin } = require('../../libs/middleware/lib-auth');
const adminUserLevels = require("../../libs/controllers/admin/admin-userlevels");

module.exports = express.Router()

	.use(authAdmin)
    .post('/', async (req, res) => {
        await adminUserLevels.createUserLevel(req, res);
    })
    .put('/:id', async (req, res) => {
        await adminUserLevels.editUserLevel(req, res);
    })
    .get('/', async (req, res) => {
        await adminUserLevels.getUserLevels(req, res);
    })
    .delete('/:id', async (req, res) => {
        await adminUserLevels.deleteUserLevel(req, res);
    })
;

