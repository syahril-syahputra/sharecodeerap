const express = require("express");
const { authAdmin } = require("../../libs/middleware/lib-auth");
const {
    updateVoice,
    createVoice,
    getAllVoice,
    deleteVoice,
    getAllVoiceModelOpenAiTTS,
    testVoiceModelOpenAiTTS,
    useVoiceModel,
} = require("../../libs/controllers/admin/admin-voiceLanguage");

module.exports = express
    .Router()
    .use(authAdmin)
    .get("/", async (req, res) => {
        await getAllVoice(req, res);
    })
    .post("/", async (req, res) => {
        await createVoice(req, res);
    })
    .put("/:id", async (req, res) => {
        await updateVoice(req, res);
    })
    .delete("/:id", async (req, res) => {
        await deleteVoice(req, res);
    })
    .get("/openai-tts", async (req, res) => {
        await getAllVoiceModelOpenAiTTS(req, res);
    })
    .post("/openai-tts/use/:id", async (req, res) => {
        await useVoiceModel(req, res);
    })
    .post("/openai-tts/test", async (req, res) => {
        await testVoiceModelOpenAiTTS(req, res);
    })
    ;
