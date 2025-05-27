const express = require('express');

const { authAdmin } = require('../../libs/middleware/lib-auth');
const adminLanguages = require("../../libs/controllers/admin/admin-languages");

module.exports = express.Router()

	.use(authAdmin)
    .post('/', async (req, res) => {
        await adminLanguages.createLanguage(req, res);
    })
    .put('/:id', async (req, res) => {
        await adminLanguages.editLanguage(req, res);
    })
    .get('/', async (req, res) => {
        await adminLanguages.getLanguages(req, res);
    })
    .delete('/:id', async (req, res) => {
        await adminLanguages.deleteLanguage(req, res);
    })
;

