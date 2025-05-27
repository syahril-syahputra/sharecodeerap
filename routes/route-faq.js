const express = require('express');
const faqController = require("../libs/controllers/faq");
const { auth } = require('../libs/middleware/lib-auth');
module.exports = express.Router()

    // .use(auth)
    .get('/:languageId', async (req, res) => {
        await faqController.getAllFAQForLanguage(req, res);
    })

;