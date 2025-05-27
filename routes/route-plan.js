const express = require('express');
const planController = require('../libs/controllers/plan');

module.exports = express.Router()
    .get('/', async (req, res) => {
        await planController.getAllPlan(req, res);
    })