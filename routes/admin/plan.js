const {
    getPlan,
    getPlanField,
    destroyPlan,
    editPlan,
    createNewPlan,
} = require("../../libs/controllers/admin/product");
const { authAdmin } = require("../../libs/middleware/lib-auth");

module.exports = require("express")
    .Router()
    .use(authAdmin)
    .get("/", async (req, res) => {
        await getPlan(req, res);
    })
    .post("/", async (req, res) => {
        await createNewPlan(req, res);
    })
    .put("/:id", async (req, res) => {
        await editPlan(req, res);
    })
    .delete("/:id", async (req, res) => {
        await destroyPlan(req, res);
    })
    .get("/field-type", async (req, res) => {
        await getPlanField(req, res);
    });
