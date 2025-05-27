const app = require("express");
const { auth } = require("../libs/middleware/lib-auth");
const { getAllTypeOfStory, getTypeOfStoryById, getRandomDataTOS } = require("../libs/controllers/typeOfStory");

module.exports = app
    .Router()
    .use(auth)
    .get("/", async (req, res) => {
        await getAllTypeOfStory(req, res)
    })
    .get("/random", async (req, res) => {
         await getRandomDataTOS(req, res)
    })
    .get("/:id", async (req, res) => {
        await getTypeOfStoryById(req, res)
    });
