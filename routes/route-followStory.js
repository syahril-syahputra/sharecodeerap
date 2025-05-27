const app = require("express");
const { auth } = require("../libs/middleware/lib-auth");
const { followStory } = require("../libs/controllers/followStory");

module.exports = app
    .Router()
    .use(auth)
    .post("/:id", async (req, res) => {
        await followStory(req, res);
    });
