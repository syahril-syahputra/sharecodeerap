require('dotenv-safe').config({allowEmptyValues : true});

const { PrismaClient } = require('@prisma/client');
const {Configuration, OpenAIApi} = require("openai");
const Sentry = require("@sentry/node");
const promptService = require("../libs/service/promptService");
const OpenAI = require("openai");
const templateHelper = require("../libs/helpers/template");

const processPrompt = async ()=>{
    try {
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_SECRET_KEY,
        });

        let messages = [];
        messages.push({"role": "system", "content": "You are a helpful chatbot that helps people"})
        messages.push({"role": "user", "content": "What color is the sun?"});

        let response = await openai.chat.completions.create({
            model: "gpt-4",
            temperature: 0.9,
            max_tokens: 150,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0.6,
            messages: messages,
        });

        console.log(response.choices[0].message.content)

    } catch (e) {
        console.error(e);
        Sentry.captureException(e);
    }
}
processPrompt();