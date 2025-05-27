const express = require('express');

const { authAdmin } = require("../../libs/middleware/lib-auth")
const { getMailLogs } = require("../../libs/controllers/admin/admin-logs")

module.exports = express.Router()
    
    .use(authAdmin)
    .get("/:id", async (req, res) => {
        await getMailLogs(req, res)
    })