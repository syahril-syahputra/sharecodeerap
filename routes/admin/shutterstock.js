const express = require('express');
const {authAdmin} = require("../../libs/middleware/lib-auth");
const adminEngines = require("../../libs/controllers/admin/admin-shutterstock");
module.exports = express.Router()

    .use(authAdmin)
    .get('/images', async (req, res) => {
        await adminEngines.getImages(req, res);
    })
    .post('/license', async (req, res) => {
        await adminEngines.licenseImage(req, res);
    })
    // .post('/license-topic', async (req, res) => {
    //     await adminEngines.licenseTopic(req, res);
    // })
;
