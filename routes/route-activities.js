const express = require('express');
const activityController = require("../libs/controllers/activity");
const { auth } = require('../libs/middleware/lib-auth');
module.exports = express.Router()

    .use(auth)
    .get('/all', async (req, res) => {
        await activityController.getAllActivities(req, res);
    })
    .get('/', async (req, res) => {
        await activityController.getActivitiesPaginated(req, res);
    })

;