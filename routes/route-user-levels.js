const express = require('express');
const levelsController = require("../libs/controllers/user-levels");
const { auth } = require('../libs/middleware/lib-auth');
module.exports = express.Router()

    .use(auth)
    .get('/', async (req, res) => {
        await levelsController.getAllLevels(req, res);
    })

;