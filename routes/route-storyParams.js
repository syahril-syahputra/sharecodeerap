const app = require("express");
const { auth } = require("../libs/middleware/lib-auth");
const {
    getAllParams,
    getDetailParamsById,
} = require("../libs/controllers/storyParams");

module.exports = app
    .Router()
    .use(auth)
    .get("/", async (req, res) => {
        await getAllParams(req, res);
    })
    .get("/:id", async (req, res) => {
        await getDetailParamsById(req, res);
    });
