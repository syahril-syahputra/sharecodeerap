const express = require('express');
const Controller = require("../libs/controllers/pois");
const { auth } = require('../libs/middleware/lib-auth');
module.exports = express.Router()

    .use(auth)
    .get('/', async (req, res) => {
        await Controller.getAllPois(req, res);
    })
    .post('/', async (req, res) => {
        await Controller.getPoisBylocation(req, res);
    })
    .get('/categories', async (req, res) => {
        await Controller.getAllPoisCategory(req, res)
    })
    .post('/suggestions', async (req, res) => {
        await Controller.getSuggestions(req, res)
    })
;