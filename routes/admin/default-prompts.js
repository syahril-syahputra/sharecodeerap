const express = require('express');

const { authAdmin } = require('../../libs/middleware/lib-auth');
const adminDefaultPrompts = require("../../libs/controllers/admin/admin-default-prompts");

module.exports = express.Router()

	.use(authAdmin)
    .post('/', async (req, res) => {
        await adminDefaultPrompts.createDefaultPrompt(req, res);
    })
    .put('/:id', async (req, res) => {
        await adminDefaultPrompts.editDefaultPrompt(req, res);
    })
    .get('/', async (req, res) => {
        await adminDefaultPrompts.getDefaultPrompts(req, res);
    })
    .get('/:id', async (req, res) => {
        await adminDefaultPrompts.getDefaultPromptDetail(req, res);
    })
    .delete('/:id', async (req, res) => {
        await adminDefaultPrompts.deleteDefaultPrompt(req, res);
    })
;

