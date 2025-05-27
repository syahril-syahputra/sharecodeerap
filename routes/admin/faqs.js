const express = require('express');
const {authAdmin} = require("../../libs/middleware/lib-auth");
const adminEngines = require("../../libs/controllers/admin/admin-faqs");
module.exports = express.Router()

    .use(authAdmin)
    .post('/', async (req, res) => {
        await adminEngines.createFaq(req, res);
    })
    .put('/:id', async (req, res) => {
        await adminEngines.editFaq(req, res);
    })
    .get('/', async (req, res) => {
        await adminEngines.getFaqs(req, res);
    })
    .delete('/:id', async (req, res) => {
        await adminEngines.deleteFaq(req, res);
    })

;