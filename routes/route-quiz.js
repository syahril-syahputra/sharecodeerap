const express = require('express');
const quizController = require("../libs/controllers/quiz");
const { auth } = require('../libs/middleware/lib-auth');
module.exports = express.Router()

    .use(auth)
    .get('/', async (req, res) => {
        await quizController.getQuizzes(req, res);
    })
    .get('/:quizId', async (req, res) => {
        await quizController.getQuiz(req, res);
    })
    .post('/:quizEntryId', async (req, res) => {
        await quizController.answer(req, res);
    })
    .get('/activities/list', async (req, res) => {
        
    })
    .get('/trivia/list', async (req, res) => {

    })
;