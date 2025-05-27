const express = require('express');
const adminAuth = require('../../libs/controllers/admin/admin-auth');
const { authAdmin } = require('../../libs/middleware/lib-auth');
module.exports = express.Router()

    .post('/login', async (req, res) => {
        await adminAuth.login(req.body, res);
    })
    .use('/', authAdmin)
    .post('/invite', async (req, res) => {
        await adminAuth.invite(req, res);
    })
;
