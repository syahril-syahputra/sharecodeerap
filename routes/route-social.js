const express = require('express');
const socialController = require("../libs/controllers/social");
const { auth } = require('../libs/middleware/lib-auth');
module.exports = express.Router()
    .get('/', async (req, res) => {
        await socialController.getAllSocial(req, res);
    })

;