const render = require("../../helpers/render");
const statuscodes = require("../../helpers/statuscodes");
const Sentry = require("@sentry/node");
const textToSpeech = require("@google-cloud/text-to-speech");
const logService = require("../../service/logService");
const { LogType, STT_Type, TTS_TYPE} = require("@prisma/client");
const client = new textToSpeech.TextToSpeechClient();
const OpenAI = require("openai");
const gptService = require("../../service/gptService");
const { ElevenLabsClient, play } = require("elevenlabs");
const { processTts } = require("../../service/elevenLabService")
const settingsRepository = require("../../repositories/settings-repository");
const groqService = require("../../service/groqService");
const DeepgramService = require("../../service/deepgramService");
const voiceLanguageRepository = require("../../repositories/voiceLanguage-repository");
const elevenLabServices = require("../../service/elevenLabService");

// const { getUsedOpenAiTTSVoiceModel } = require("../../repositories/voiceLanguage-repository");
// const openai = new OpenAI({
//     apiKey: process.env.OPENAI_SECRET_KEY,
// });
const gptController = {
    process: async (req, res) => {
        try {
            if (
                req.user.account.subscriptionStatus !== "active" &&
                req.user.account.subscriptionStatus !== "trialing"
            ) {
                render(
                    res,
                    200,
                    statuscodes.SUBSCRIPTION_NOT_ACTIVE,
                    "Subscription not active"
                );
                return;
            }

            const text = req.body.message;
            const iso = req.user.Language.iso || "en";

            let ttsSetting = await settingsRepository.getSettingByName("TTS");
            if(ttsSetting.ttsType === TTS_TYPE.MOBILE_APP){
                render(res, 400, statuscodes.BAD_REQUEST, {
                    text: "STT Type mobile app, don't use this endpoint but process, as you have done the STT locally",
                });
                return;
            }else if(ttsSetting.ttsType === TTS_TYPE.GOOGLE || (ttsSetting.ttsType === TTS_TYPE.ELEVEN_LABS && await elevenLabServices.isTokenLimitExceeded())){
                const voice = (await voiceLanguageRepository.getVoiceByIso(iso)).find(voice => voice.voice_name === ttsSetting.voice);
                const request = {
                    input: { text: text },
                    voice: {
                        languageCode: voice.voice_code || "en-US",
                        name: voice.voice_name || "en-US-Standard-F",
                    },
                    audioConfig: {
                        audioEncoding: "MP3",
                        speakingRate: 1,
                    },
                };

                await client
                    .synthesizeSpeech(request)
                    .then((response) => {
                        res.set({
                            "Content-Type": "audio/mpeg",
                            "Content-Length": response[0].audioContent.length,
                        });

                        res.send(response[0].audioContent);
                    })
                    .catch((err) => {
                        console.error("Error:", err);
                        res.status(500).send("Error generating TTS");
                    });

            }else if(ttsSetting.ttsType === TTS_TYPE.ELEVEN_LABS){
                const voiceCode = req.user.voiceCode || ttsSetting.voice;
                const model = req.user.languageId == 38 ? "eleven_turbo_v2" : "eleven_multilingual_v2";
                const response = await processTts(
                  voiceCode,
                  text,
                  model
                );
                if (response.success) {
                    res.set({
                        "Content-Type": "audio/mpeg",
                    });
                    response.response.data.pipe(res);
                } else {
                    res.set({
                        "Content-Type": "application/json",
                    });
                    res.send(response);
                }

            }else if(ttsSetting.ttsType === TTS_TYPE.DEEPGRAM_API){
                const voice = (await DeepgramService.getAvailableVoices()).find(voice => voice === ttsSetting.voice) || "aura-asteria-en"; 
                const text = req.body.message;
                const response = await DeepgramService.convertTextToSpeech(text, voice);

                res.set({
                    "Content-Type": "audio/mpeg",
                    "Content-Length": response.length,
                });
                res.send(response);

            }else{
                render(res, 400, statuscodes.INTERNAL_ERROR, {
                    text: "Invalid STT Engine",
                });
                return;
            }

            await logService.createLog(req, {
                type: LogType.TTS,
                message: `User with id : ${req.user.id} Create process TTS`,
            });

        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

    ai_process: async (req, res) => {
        try {
            if (
                req.user.account.subscriptionStatus !== "active" &&
                req.user.account.subscriptionStatus !== "trialing"
            ) {
                render(
                    res,
                    200,
                    statuscodes.SUBSCRIPTION_NOT_ACTIVE,
                    "Subscription not active"
                );
                return;
            }

            const message = await gptService.convertMp3toText(req.body.toString('base64'), req.user.Language?.iso)
            render(res, 200, statuscodes.SUCCESS, message);
            

            await logService.createLog(req, {
                type: LogType.TTS,
                message: `User with id : ${req.user.id} Create process STT using ai`,
            });
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

    elevan_lab_process: async (req, res) => {
        if (
            req.user.account.subscriptionStatus !== "active" &&
            req.user.account.subscriptionStatus !== "trialing"
        ) {
            render(
                res,
                200,
                statuscodes.SUBSCRIPTION_NOT_ACTIVE,
                "Subscription not active"
            );
            return;
        }
        const { voiceId, text, modelId } = req.body;
        try {
            const response = await processTts(voiceId, text, modelId);
            if (response.success) {
                res.set({
                    "Content-Type": "audio/mpeg",
                });
                response.response.data.pipe(res);
            } else {
                res.set({
                    "Content-Type": "application/json",
                });
                res.send(response);
            }
        } catch (error) {
            console.error('Error in elevan_lab_process:', error);
            res.set({
                "Content-Type": "application/json",
            });
            res.status(500).send(error);
        }
    }
};

module.exports = gptController;
