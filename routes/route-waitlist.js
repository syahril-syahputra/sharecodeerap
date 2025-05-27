const express = require('express')
const waitlistController = require('../libs/controllers/waitlist')
const render = require("../libs/helpers/render");
const statuscodes = require("../libs/helpers/statuscodes");

module.exports = express.Router()
    .post('/', async ( req, res) => {
        await waitlistController.addWaitList(req, res);
    })
    .post('/check', async (req, res) => {
        await waitlistController.checkWaitList(req, res);
    })