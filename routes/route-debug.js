const express = require('express');
const gptController = require("../libs/controllers/debug/debug-gpt");
const { authDebug } = require('../libs/middleware/lib-auth');
module.exports = express.Router()

    .use(authDebug)
    .get('/session/:sessionId', async (req, res) => {
        await gptController.getSessionDetail(req, res);
    })

;