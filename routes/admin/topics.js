const express = require('express');

const { authAdmin } = require('../../libs/middleware/lib-auth');
const adminTopics = require("../../libs/controllers/admin/admin-topics");

module.exports = express.Router()

	.use(authAdmin)
    .post('/', async (req, res) => {
        await adminTopics.createTopic(req, res);
    })
    .put('/:id', async (req, res) => {
        await adminTopics.editTopic(req, res);
    })
    .get('/', async (req, res) => {
        await adminTopics.getTopics(req, res);
    })
    .delete('/:id', async (req, res) => {
        await adminTopics.deleteTopic(req, res);
    })
;

