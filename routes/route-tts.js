const express = require('express');
const routeTTS = require("../libs/controllers/tts/tts");
const routeVoices = require("../libs/controllers/tts/voices");
const routeModels = require("../libs/controllers/tts/model");
const { auth } = require('../libs/middleware/lib-auth');
module.exports = express.Router()

    .use(auth)
    .post('/process', async (req, res) => {
        await routeTTS.process(req, res);
    })
    .post('/elevan-lab-process', async (req, res) => {
        await routeTTS.elevan_lab_process(req, res);
    })
    .post('/ai-process', async (req, res) => {
        await routeTTS.process(req, res);
    })
    .get('/voices', async (req, res) => {
        await routeVoices.getVoices(req, res);
    })
    .get('/elevan-lab-voices', async (req, res) => {
        await routeVoices.getElevanLabVoices(req, res);
    })
    .get('/elevan-lab-models', async (req, res) => {
        await routeModels.getElevanLabsModel(req, res);
    })
    .post('/voice', async (req, res) => {
        await routeVoices.setVoice(req, res);
    })
    .get('/deepgram-voices', async (req, res) => {
        await routeVoices.getDeepgramVoices(req, res);
    })
    // .get('/deepgram-models', async (req, res) => {
    //     await routeVoices.getDeepgramModels(req, res);
    // })
;