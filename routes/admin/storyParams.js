const app = require("express");
const { authAdmin } = require("../../libs/middleware/lib-auth");
const {
    getAllParamsByActivityId,
    getAllStoryParams,
    postNewParams,
    updateParams,
    deleteParams,
    updateStoryParamType,
    getAllTypeOfStoryByParamId,
    updateActivityStatus,
} = require("../../libs/controllers/admin/admin-storyParams");

module.exports = app
    .Router()
    .use(authAdmin)
    .get("/", async (req, res) => {
        await getAllStoryParams(req, res);
    })
    .post("/", async (req, res) => {
        await postNewParams(req, res);
    })
    .put("/:id", async (req, res) => {
        await updateParams(req, res);
    })
    .delete("/:id", async (req, res) => {
        await deleteParams(req, res);
    })
    .get("/activity/:id", async (req, res) => {
        await getAllParamsByActivityId(req, res);
    })
    .post("/activity/:id", async (req, res) => {
        await updateActivityStatus(req, res);
    })
    .get("/type-of-story/:id", async (req, res) => {
        await getAllTypeOfStoryByParamId(req, res);
    })
    .post("/type-of-story/:id", async (req, res) => {
        await updateStoryParamType(req, res);
    });
