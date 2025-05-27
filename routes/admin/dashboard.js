const express = require('express');
const dashboard = require('../../libs/controllers/admin/admin-dashboard');
const { authAdmin } = require('../../libs/middleware/lib-auth');
module.exports = express.Router()
    .use(authAdmin)
    .get('/', async (req, res) => {
        await dashboard.getDashboard(req, res);
    });




