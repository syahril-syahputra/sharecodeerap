const express = require('express');
const { auth } = require('../libs/middleware/lib-auth');
const { joinNewsletter } = require('../libs/controllers/newsletter');
module.exports = express.Router()

    .use(auth)
    .post('/', async (req, res) => {
        await joinNewsletter(req, res);
    });