const Sentry = require("@sentry/node");
const {createClient} = require("@deepgram/sdk");
const deepgram = createClient(process.env.DEEPGRAM_API);
const fs = require("fs");

const deepgramService = {

    convertSpeechtoText: async (audio) => {

        const {result, error} = await deepgram.listen.prerecorded.transcribeFile(
            audio,
            {
                model: "nova",
            }
        );

        if (error) {
            return;
        }

        return result.results.channels[0].alternatives[0].transcript;
    },

    convertTextToSpeech: async (text, voice) => {
        const response = await deepgram.speak.request(
            {text},
            {
                model: voice || "aura-asteria-en",
                encoding: "mp3"
            }
        );

        const stream = await response.getStream();
        const headers = await response.getHeaders();
        if (stream) {
            const buffer = await deepgramService.getAudioBuffer(stream);
            return buffer;
        } else {
            console.error("Error generating audio:", stream);
        }

        if (headers) {
            console.log("Headers:", headers);
        }
    },

    getAudioBuffer: async (response) => {
        const reader = response.getReader();
        const chunks = [];

        while (true) {
            const {done, value} = await reader.read();
            if (done) break;

            chunks.push(value);
        }

        const dataArray = chunks.reduce(
            (acc, chunk) => Uint8Array.from([...acc, ...chunk]),
            new Uint8Array(0)
        );

        return Buffer.from(dataArray.buffer);
    },

    getAvailableVoices: async () => {
        return ["aura-asteria-en", "aura-luna-en", "aura-stella-en", "aura-athena-en", "aura-hera-en",
            "aura-orion-en", "aura-arcas-en", "aura-perseus-en", "aura-angus-en", "aura-orpheus-en",
            "aura-helios-en", "aura-zeus-en"
        ];
    },

};

module.exports = deepgramService;
