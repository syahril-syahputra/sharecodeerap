const express = require('express');
const Controller = require("../libs/controllers/join");
const { auth } = require('../libs/middleware/lib-auth');
module.exports = express.Router()

    .get('/:token', async (req, res) => {
        await Controller.joinPage(req, res);
    })

;