const express = require('express');

const { authAdmin } = require('../../libs/middleware/lib-auth');
const adminOpenAIParams = require("../../libs/controllers/admin/admin-openai-params");

module.exports = express.Router()

	.use(authAdmin)
    .post('/', async (req, res) => {
        await adminOpenAIParams.createOpenAIParam(req, res);
    })
    .get('/list-engines', async (req, res) => {
        await adminOpenAIParams.listEngines(req, res);
    })
    .put('/:id', async (req, res) => {
        await adminOpenAIParams.editOpenAIParam(req, res);
    })
    .get('/', async (req, res) => {
        await adminOpenAIParams.getOpenAIParams(req, res);
    })
    .get('/:id', async (req, res) => {
        await adminOpenAIParams.getOpenAIParamDetail(req, res);
    })
    .delete('/:id', async (req, res) => {
        await adminOpenAIParams.deleteOpenAIParam(req, res);
    })
;

