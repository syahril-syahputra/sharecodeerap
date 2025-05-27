const express = require('express');
const { auth } = require('../libs/middleware/lib-auth');
const pointController = require('../libs/controllers/points');

module.exports = express.Router()
    .use(auth)
    .get('/', async (req, res) => {
        await pointController.getPoint(req, res)
    })
    .put('/', async (req, res) => {
        await pointController.updatePoint(req, res)
    })