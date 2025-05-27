const express = require('express');
const promptController = require("../libs/controllers/prompt");
const { auth } = require('../libs/middleware/lib-auth');
module.exports = express.Router()

    .use(auth)
    .get('/', async (req, res) => {
        await promptController.getPromptsPaginated(req, res);
    })

    .post('/history', async (req, res) => {
        await promptController.getPromptHistory(req, res);
    })

    .delete('/:id', async (req, res) => {
        await promptController.deletePrompt(req, res);
    })
    .post('/report/:id', async (req, res) => {
        await promptController.reportPrompt(req, res);
    })

;