const express = require("express");

const { authAdmin } = require("../../libs/middleware/lib-auth");
const adminQueryController = require("../../libs/controllers/admin/admin-query");

module.exports = express
    .Router()
    .use(authAdmin)
    .post("/", async (req, res) => {
        await adminQueryController.createQuery(req, res);
    })
    .put("/:id", async (req, res) => {
        await adminQueryController.editQuery(req, res);
    })
    .get("/", async (req, res) => {
        await adminQueryController.getQueries(req, res);
    })
    .delete("/:id", async (req, res) => {
        await adminQueryController.deleteQuery(req, res);
    })
    .post("/conditions", async (req, res) => {
        await adminQueryController.createConditions(req, res);
    })
    .get("/conditions/:id", async (req, res) => {
        await adminQueryController.getQueryConditions(req, res);
    })
    .delete("/conditions/:id", async (req, res) => {
        await adminQueryController.deleteConditions(req, res);
    })
    .get("/fields", async (req, res) => {
        await adminQueryController.getQueryFields(req, res);
    })
    .post('/try', async (req, res) => {
        await adminQueryController.tryRawQuery(req, res);
    })
;
