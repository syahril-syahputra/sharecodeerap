const express = require('express');

const { authAdmin } = require('../../libs/middleware/lib-auth');
const adminActivities = require("../../libs/controllers/admin/admin-activities");

module.exports = express.Router()

	.use(authAdmin)
    .post('/', async (req, res) => {
        await adminActivities.createActivity(req, res);
    })
    .put('/:id', async (req, res) => {
        await adminActivities.editActivity(req, res);
    })
    .get('/', async (req, res) => {
        await adminActivities.getActivities(req, res, false);
    })
    .delete('/:id', async (req, res) => {
        await adminActivities.deleteActivity(req, res);
    })
    .get('/:id', async (req, res) => {
        await adminActivities.getTopicActivity(req, res);
    })
    ;

