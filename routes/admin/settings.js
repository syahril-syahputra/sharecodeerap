const express = require('express');

const { authAdmin } = require('../../libs/middleware/lib-auth');
const adminSettingsController = require('../../libs/controllers/admin/admin-settings');
const voicesController = require('../../libs/controllers/tts/voices');
const modelController = require('../../libs/controllers/tts/model');

module.exports = express.Router()

    .use(authAdmin)

    .get('/', async (req, res) => {
        await adminSettingsController.getSettings(req, res);
    })
    .get('/google-voices', async (req, res) => {
        await voicesController.getAllVoice(req, res);
    })
    .get('/deepgram-voices', async (req, res) => {
        await voicesController.getDeepgramVoices(req, res);
    })
    .get('/elevan-lab-voices', async (req, res) => {
        await voicesController.getElevanLabVoices(req, res);
    })
    .get('/elevan-lab-models', async (req, res) => {
        await modelController.getElevanLabsModel(req, res);
    })
    .get('/:type', async (req, res) => {
        await adminSettingsController.getSettingsByName(req, res);
    })

    .get('/stripe-visibility', async (req, res) => {
        await adminSettingsController.getStripeVisibility(req, res);
    })

    .post('/stripe-visibility', async (req, res) => {
        await adminSettingsController.setStripeVisibility(req, res);
    })

    .post('/stt', async (req, res) => {
        await adminSettingsController.setSTT(req, res);
    })

    .post('/tts', async (req, res) => {
        await adminSettingsController.setTTS(req, res);
    })
;