const express = require("express");

// const { auth } = require('../../libs/middleware/lib-auth');
const { authAdmin } = require("../../libs/middleware/lib-auth");
const {
    getLogsAccount,
    getErrorLogs,
    getTransactionLogs,
} = require("../../libs/controllers/admin/admin-logs");

module.exports = express
    .Router()
    .use(authAdmin)
    .get("/error", async (req, res) => {
        await getErrorLogs(req, res);
    })
    .get("/transactions", async (req, res) => {
        await getTransactionLogs(req, res);
    })
    .get("/:id", async (req, res) => {
        await getLogsAccount(req, res);
    })
    
;
