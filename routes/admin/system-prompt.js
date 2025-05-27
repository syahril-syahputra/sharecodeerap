const express = require('express');

const { authAdmin } = require('../../libs/middleware/lib-auth');
const adminSystemPrompts = require("../../libs/controllers/admin/admin-system-prompt");

module.exports = express.Router()

	.use(authAdmin)
    .get('/', async (req, res) => {
        await adminSystemPrompts.getSystemPrompts(req, res);
    })
    .get('/:id', async (req, res) => {
        await adminSystemPrompts.getSystemPromptsDetail(req, res);
    })
    .put('/:id', async (req, res) => {
        await adminSystemPrompts.editSystemPrompt(req, res);
    })
;

