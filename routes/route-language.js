const express = require('express');
const languageController = require("../libs/controllers/language");
const { auth } = require('../libs/middleware/lib-auth');
module.exports = express.Router()
    .get('/', async (req, res) => {
        await languageController.getAllLanguages(req, res);
    })

;