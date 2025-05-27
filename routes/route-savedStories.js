const app = require("express");
const { auth } = require("../libs/middleware/lib-auth");
const {
    getAllSavedStories,
    addSavedStory,
    getDetailSavedStory,
    deleteSavedStory,
} = require("../libs/controllers/savedStory");

module.exports = app
    .Router()
    .use(auth)
    .get("/", async (req, res) => {
        await getAllSavedStories(req, res);
    })
    .post("/", async (req, res) => {
        await addSavedStory(req, res);
    })
    .get("/:id", async (req, res) => {
        await getDetailSavedStory(req, res);
    })
    .delete("/:id", async (req, res) => {
        await deleteSavedStory(req, res);
    });
