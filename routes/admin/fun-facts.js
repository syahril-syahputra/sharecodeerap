const express = require("express");

const { authAdmin } = require("../../libs/middleware/lib-auth");
const {
    getPromptFunFact,
} = require("../../libs/controllers/admin/admin-fun-fact");

module.exports = express
    .Router()
    .use(authAdmin)
    .get("/:promptId", getPromptFunFact);
