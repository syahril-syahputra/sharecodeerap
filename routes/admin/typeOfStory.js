const app = require("express");
const {
    getAllTypeOfStory,
    createTypeOfStory,
    updateTypeOfStory,
} = require("../../libs/controllers/admin/admin-typeOfStory");
const { authAdmin } = require("../../libs/middleware/lib-auth");

module.exports = app
    .Router()
    .use(authAdmin)
    .get("/", async (req, res) => {
        await getAllTypeOfStory(req, res);
    })
    .post("/", async (req, res) => {
        await createTypeOfStory(req, res);
    })
    .put("/:id", async (req, res) => {
        await updateTypeOfStory(req, res);
    });
