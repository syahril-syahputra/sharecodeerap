const render = require("../../helpers/render");
const statuscodes = require("../../helpers/statuscodes");
const userRepository = require("../../repositories/user-repository");
const DeepgramService = require("../../service/deepgramService");
const Sentry = require("@sentry/node");
const textToSpeech = require('@google-cloud/text-to-speech');
const client = new textToSpeech.TextToSpeechClient();
const Joi = require("joi");
const { getAll } = require("../../repositories/voiceLanguage-repository");
const { getAvailableVoices } = require("../../service/elevenLabService");
const settingsRepository = require("../../repositories/settings-repository");
const { TTS_TYPE } = require("@prisma/client");
const voiceLanguageRepository = require("../../repositories/voiceLanguage-repository");

const voicesController = {
    getAllVoice:  async (req, res) => {
        try {


            const getData = await voiceLanguageRepository.getAll()
            const voices = getData.map(voice => ({ voice_id: voice.voice_name, name: voice.voice_name }));
            render(res, 200, statuscodes.OK, voices);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
    getVoices: async (req, res) => {
        try {
            const iso = req.user.Language.iso || "en";
            const ttsSetting = await settingsRepository.getSettingByName("TTS");
            let voices = [];
            if (ttsSetting.ttsType === TTS_TYPE.MOBILE_APP) {
                voices = []
            }else if(ttsSetting.ttsType === TTS_TYPE.GOOGLE){
                voices = (await voiceLanguageRepository.getVoiceByIso(iso)).map(voice => ({ voice_id: voice.voice_name, name: voice.voice_name }));
            }else if(ttsSetting.ttsType === TTS_TYPE.ELEVEN_LABS){
                voices = await getAvailableVoices();
            }else if(ttsSetting.ttsType === TTS_TYPE.DEEPGRAM_API){
                voices =(await DeepgramService.getAvailableVoices()).map(voice => ({ voice_id: voice, name: voice }));
            }
            render(res, 200, statuscodes.OK, voices);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

    setVoice: async (req, res) => {
        try {

            const schema = Joi.object({
                voiceId: Joi.number(),
                // voiceName: Joi.string(),
                // voiceCode: Joi.string(),
            });

            const {error, value} = schema.validate(req.body);
            if (error) {
                render(res, 400, statuscodes.VALIDATION_ERROR, error);
                return;
            }

            let user = userRepository.setUserVoice(req.user.id, req.body);
            render(res, 200, statuscodes.OK, user);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

    getElevanLabVoices: async (req, res) => {
        try {
            let voices = await getAvailableVoices();
            render(res, 200, statuscodes.OK, voices);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

    getDeepgramVoices: async (req, res) => {
        try {
            let voices = await DeepgramService.getAvailableVoices();
            render(res, 200, statuscodes.OK, voices);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

}

module.exports = voicesController;
