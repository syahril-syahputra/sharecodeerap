const OpenAI = require("openai");
const openai = new OpenAI({
    apiKey: process.env.OPENAI_SECRET_KEY,
});
const Sentry = require("@sentry/node");
const languageRepository = require("../repositories/language-repository");
const defaultPromptService = require("./defaultPromptService");
const defaultPromptRepository = require("../repositories/default-prompt-repository");
const promptService = require("./promptService");
const stringHelper = require("../helpers/string");

const dalleService = {
    asdf: async (prompt) => {
        try {
            const response = await openai.images.generate({
                model: "dall-e-3",
                prompt: prompt,
                n: 1,
                size: "1024x1024",
            });

            return response.data[0].url;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            return "";
        }
    },

    generateImage: async (user, concept) => {
        let language = await languageRepository.getLanguagesById(
            user.languageId
        );

        let initialPrompt = await defaultPromptService.inferPromptForUser(user);
        if (!initialPrompt) {
            throw new Error("Couldn't get a default prompt");
        }
        initialPrompt = await defaultPromptRepository.getPromptByIdForDalle(
            initialPrompt.id
        );
        let engine = initialPrompt.dalleParams.Engine;
        if (!engine) {
            throw new Error("Engine not found");
        }

        let messages = promptService.assembleDalle(
            concept.concept,
            initialPrompt,
            language,
            user
        );

        let openAIparams = initialPrompt.dalleParams;

        const response = await openai.images.generate({
            model: engine.model,
            prompt: messages,
            n: 1,
            size: "1024x1024",
        });

        return {
            text: response.data[0].revised_prompt,
            fullRequest: messages,
            initialPrompt: initialPrompt,
            image: response.data[0].url,
        };
    },
};

module.exports = dalleService;
