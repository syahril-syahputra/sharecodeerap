const express = require("express");
const { authAdmin } = require("../../libs/middleware/lib-auth");
const adminPoiImageController = require("../../libs/controllers/admin/admin-poi-images");
module.exports = express
    .Router()
    .use(authAdmin)
    .get("/", async (req, res) => {
        await adminPoiImageController.getImages(req, res);
    })
    .post("/", async (req, res) => {
        await adminPoiImageController.createImages(req, res);
    })
    .put("/:id", async (req, res) => {
        await adminPoiImageController.updateImages(req, res);
    })
    .delete("/:id", async (req, res) => {
        await adminPoiImageController.deleteImages(req, res);
    })
    
;
