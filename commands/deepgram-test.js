require('dotenv-safe').config({allowEmptyValues: true});
const { createClient, CallbackUrl } = require("@deepgram/sdk");
const fs = require("fs");
const path = require('path');

const deepgramService = require("../libs/service/deepgramService");

const deepgram = createClient(process.env.DEEPGRAM_API);

const run = async () => {
    // const filePath = path.join(__dirname, 'nasa.mp4'); // Construct the absolute path
    //
    // const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
    //     fs.readFileSync(filePath),
    //     {
    //         model: "nova",
    //     }
    // );
    //
    // console.log(result.results.channels[0].alternatives[0].transcript)

    let result = await deepgramService.convertTextToSpeech("Hello, how are you?");
    console.log(result);
}

run();