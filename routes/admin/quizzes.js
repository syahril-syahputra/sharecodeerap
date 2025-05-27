const express = require('express');

const { authAdmin } = require('../../libs/middleware/lib-auth');
const adminQuizzes = require("../../libs/controllers/admin/admin-quizzes");

module.exports = express.Router()

	.use(authAdmin)
    .get('/:userId', async (req, res) => {
        await adminQuizzes.getQuizzes(req, res);
    })
    .get('/completed/:userId', async (req, res) => {
        await adminQuizzes.getCompleteQuizzes(req, res);
    })
;

