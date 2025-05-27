const express = require('express');
const topicController = require("../libs/controllers/topic");
const { auth } = require('../libs/middleware/lib-auth');
module.exports = express.Router()

    .use(auth)
    .get('/all', async (req, res) => {
        await topicController.getTopicsPaginated(req, res);
    })
    .post('/random', async (req, res) => {
        await topicController.getAllRandomizeTopic(req, res);
    })
    .get('/:activityId', async (req, res) => {
        await topicController.getAllTopics(req, res);
    })

;