const Sentry = require("@sentry/node");
const render = require("../../helpers/render");
const statuscodes = require("../../helpers/statuscodes");
const {
    updateVoiceLanguage,
    createVoiceLanguage,
    getAll,
    getAllByLanguage,
    deleteVoiceLanguage,
    getVoiceTTSModel,
    useOpenAiTTSModel,
} = require("../../repositories/admin/voiceLanguage-repository");
// const logService = require('../service/logService');
// const { LogType } = require('@prisma/client');
const OpenAI = require("openai");
const openai = new OpenAI({
    apiKey: process.env.OPENAI_SECRET_KEY,
});

const adminVoiceLanguageController = {
    getAllVoice: async (req, res) => {
        try {
            const { language } = req.query;
            let voices;
            if (language === "null") {
                voices = await getAll();
            } else if (language !== "null" && language.length > 0) {
                voices = await getAllByLanguage(language);
            } else {
                voices = await getAll();
            }

            render(res, 200, statuscodes.OK, voices);
        } catch (e) {
            render(res, 500, statuscodes.DB_ERROR, {});
            Sentry.captureException(e);
            console.error(e);
        }
    },
    updateVoice: async (req, res) => {
        try {
            const { id } = req.params;
            const updateVoice = await updateVoiceLanguage(
                req.body,
                parseInt(id)
            );

            render(res, 200, statuscodes.OK, updateVoice);
        } catch (e) {
            render(res, 500, statuscodes.DB_ERROR, {});
            Sentry.captureException(e);
            console.error(e);
        }
    },
    createVoice: async (req, res) => {
        try {
            const create = await createVoiceLanguage(req.body);

            render(res, 201, statuscodes.OK, create);
        } catch (e) {
            render(res, 500, statuscodes.DB_ERROR, {});
            console.error(e);
            Sentry.captureException(e);
        }
    },
    deleteVoice: async (req, res) => {
        try {
            const { id } = req.params;
            const deletedVoice = await deleteVoiceLanguage(parseInt(id));

            render(res, 201, statuscodes.OK, {});
        } catch (e) {
            render(res, 500, statuscodes.DB_ERROR, {});
            console.error(e);
            Sentry.captureException(e);
        }
    },
    testVoiceModelOpenAiTTS: async (req, res) => {
        try {
            const { body: data } = req;
            // console.log(req.body)
            const mp3 = await openai.audio.speech.create({
                model: data.model, //! there's just only 2 different model tts-1 and tts-1-hd
                voice: data.voice.toLowerCase(), //! voice has 6 different type alloy, echo, fable, onyx, nova, and shimmer.
                input: data.message,
                //! response_format: "arraybuffer", ////!This Can be using opus, aac, flac, and mp3 as default
            });

            const buffer = Buffer.from(await mp3.arrayBuffer());

            // //! Set the Content-Type header to indicate that the response is an MP3 file
            res.setHeader("Content-Type", "audio/mpeg");

            // //! Send the MP3 buffer as the response
            res.send(buffer);
        } catch (e) {
            render(res, 500, statuscodes.DB_ERROR, {});
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getAllVoiceModelOpenAiTTS: async (req, res) => {
        try {
            const result = await getVoiceTTSModel()

            render(res, 200, statuscodes.OK, result)
        } catch (e) {
            render(res, 500, statuscodes.DB_ERROR, {});
            console.error(e);
            Sentry.captureException(e);
        }
    },
    useVoiceModel : async (req, res) => {
        try {
            const result = await useOpenAiTTSModel(parseInt(req.params.id))
            // console.log(result)
            render(res, 200, statuscodes.OK, result)
        } catch (e) {
            render(res, 500, statuscodes.DB_ERROR, {});
            console.error(e);
            Sentry.captureException(e);
        }
    }};

module.exports = {
    ...adminVoiceLanguageController,
};
