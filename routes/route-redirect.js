const express = require('express');
const redirectController = require('../libs/controllers/redirect');
module.exports = express.Router()

    .get('/confirmation/:token', async (req, res) => {
        await redirectController.confirmEmail(req, res);
    })

    .get('/login/:token', async (req, res) => {
        await redirectController.loginWithEmail(req, res);
    })

;