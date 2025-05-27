const express = require('express');

const { authAdmin } = require('../../libs/middleware/lib-auth');
const { getAgeRangeGroup, createAgeRange, updateAgeRange, deleteAgeRange } = require('../../libs/controllers/admin/admin-ageRange');

module.exports = express.Router()

	.use(authAdmin)
    .get('/', async (req, res) => {
        await getAgeRangeGroup(req, res)
    })
    .post('/', async(req, res) => {
        await createAgeRange(req, res)
    })
    .put('/:id', async (req, res) => {
        await updateAgeRange(req, res)
    })
    .delete('/:id', async (req, res) => {
        await deleteAgeRange(req, res)
    })
    ;

