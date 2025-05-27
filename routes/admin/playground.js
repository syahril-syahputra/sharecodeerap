const express = require('express');

const { authAdmin } = require('../../libs/middleware/lib-auth');
const adminPlayground = require("../../libs/controllers/admin/admin-playground");

module.exports = express.Router()

    .use(authAdmin)
    .get('/daily-recap/:id', async (req, res) => {
        await adminPlayground.dailyRecap(req, res);
    })

    .get('/daily-recap-send/:id', async (req, res) => {
        await adminPlayground.dailyRecapSend(req, res);
    })

;

