const express = require('express');
const { authAdmin} = require('../../libs/middleware/lib-auth');
const { fetchQuestion, createNewQuestion, deletePredefinedQuestion, putQuestion, generateNewQuestions } = require('../../libs/controllers/admin/admin-predefinedQuestion');
module.exports = express.Router()

    .use(authAdmin)
    .post('/generate', async (req, res) => {
        await generateNewQuestions(req, res)
    })
    .get('/', async (req, res) => {
        await fetchQuestion(req, res)
    })
    .post('/', async (req, res) => {
        await createNewQuestion(req, res)
    })
    .put('/:id', async (req, res) => {
        await putQuestion(req, res)
    })
    .delete('/:id', async (req, res) => {
        await deletePredefinedQuestion(req, res)
    })  
;