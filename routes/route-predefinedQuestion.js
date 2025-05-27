const express = require('express');
const { auth } = require('../libs/middleware/lib-auth');
const { getRandomizedQuestion, addQuestion } = require('../libs/controllers/predefinedQuestion');
module.exports = express.Router()

    .use(auth)
    .get('/', async (req, res) => {
        await getRandomizedQuestion(req , res)
    })
    .post('/add-question', async (req, res) => {
        await addQuestion(req , res)
    }) 
;