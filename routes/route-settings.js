const express = require('express');
const settingsController = require("../libs/controllers/settings");
const { auth } = require('../libs/middleware/lib-auth');
module.exports = express.Router()
    .get('/', async (req, res) => {
        await settingsController.getAllSettings(req, res);
    })

;