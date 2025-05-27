// const Groq = require("groq-sdk");

const { default: Groq } = require("groq-sdk");
const sessionRepository = require("../repositories/session-repository");
const languageRepository = require("../repositories/language-repository");
const promptService = require("./promptService");
const gptService = require("./gptService");
const PromptType = require("../helpers/enums/PromptType");
const defaultPromptService = require("./defaultPromptService");
const defaultPromptRepository = require("../repositories/default-prompt-repository");
const Sentry = require("@sentry/node");
const { createWriteStream } = require("fs");
const fs = require("fs");
const temp = require("temp");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

async function base64ToTempFile(base64String) {
    const buffer = Buffer.from(base64String, "base64");
    const tempFilePath = temp.path({ suffix: ".wav" });

    return new Promise((resolve, reject) => {
        const writeStream = createWriteStream(tempFilePath);
        writeStream.write(buffer);

        writeStream.on("finish", () => {
            resolve(tempFilePath);
        });

        writeStream.on("error", (error) => {
            reject(error);
        });

        writeStream.end();
    });
}
const groqService = {

    processWithLlama: async (user, message, session, type) => {
        try {
            let language = await languageRepository.getLanguagesById(
                user.languageId
            );

            let openAIparams;
            if (type === PromptType.DEFAULT) {
                openAIparams = session.DefaultPrompt.mainParams;
            } else if (type === PromptType.EXPLAIN_MORE) {
                openAIparams = session.DefaultPrompt.explainMoreParams;
            } else if (type === PromptType.FUN_FACTS) {
                openAIparams = session.DefaultPrompt.funFactsParams;
            }

            let messages = await promptService.assembleLlama3Prompt(
                session,
                message,
                type,
                language,
                user
            );

            let requestParams = {
                model: openAIparams?.Engine?.model || "llama3-8b-8192",
                temperature: openAIparams.temperature || 0.7,
                max_tokens: openAIparams.maxTokens || 150,
                top_p: openAIparams.topP || 1.0,
                messages: messages,
            };

            const response = await groq.chat.completions.create(
                requestParams
            );

            return {
                text: response.choices[0].message.content,
                session: session,
                fullRequest: requestParams,
                ...response.usage,
            };
        } catch (e) {
            console.log("error_groq");
            console.error(e);
            Sentry.captureException(e);
            return null;
        }
    },

    processFactsUsingLlama: async (user, topic) => {
        try {
            let language = await languageRepository.getLanguagesById(
                user.languageId
            );

            let initialPrompt = await defaultPromptService.inferPromptForUser(
                user
            );
            if (!initialPrompt) {
                throw new Error("Couldn't get a default prompt");
            }

            // We hydrate it
            initialPrompt = await defaultPromptRepository.getPromptByIdForFact(
                initialPrompt.id
            );
            let openAiParams = initialPrompt.factParams;
            let messages = promptService.assembleChatGPTForFacts(
                topic,
                initialPrompt,
                language,
                user
            );

            let requestParams = {
                model: "llama3-8b-8192",
                temperature: openAiParams.temperature || 0.7,
                max_tokens: openAiParams.maxTokens || 150,
                top_p: openAiParams.topP || 1.0,
                messages: messages,
                stream: false,
                stop: null,
            };

            const response = await groq.chat.completions.create(requestParams);
            const textResponse = response.choices[0].message.content;
            const parsedResponse = JSON.parse(textResponse);

            let facts = parsedResponse.facts;
            facts.forEach((fact) => {
                console.log(fact);
            });
            return {
                text: textResponse,
                fullRequest: requestParams,
                result: parsedResponse?.facts || parsedResponse,
                chatCompletion: response,
            };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    processFactsUsingLlamaAndPrompt: async (user, prompt) => {
        try {
            let language = await languageRepository.getLanguagesById(
                user.languageId
            );

            let initialPrompt = await defaultPromptService.inferPromptForUser(
                user
            );
            if (!initialPrompt) {
                throw new Error("Couldn't get a default prompt");
            }

            // We hydrate it
            initialPrompt = await defaultPromptRepository.getPromptByIdForFact(
                initialPrompt.id
            );
            let openAiParams = initialPrompt.factParams;
            let messages = promptService.assembleChatGPTForFactsUsingPrompt(
                prompt,
                initialPrompt,
                language,
                user
            );

            let requestParams = {
                model: "llama3-8b-8192",
                temperature: openAiParams.temperature || 0.7,
                max_tokens: openAiParams.maxTokens || 150,
                top_p: openAiParams.topP || 1.0,
                messages: messages,
                stream: false,
                stop: null,
            };

            const response = await groq.chat.completions.create(requestParams);
            const textResponse = response.choices[0].message.content || '';
            const parsedResponse = JSON.parse(textResponse);

            let facts = parsedResponse.facts;
            facts.forEach((fact) => {
                console.log(fact);
            });

            return {
                text: textResponse,
                fullRequest: requestParams,
                result: parsedResponse?.facts || parsedResponse,
                chatCompletion: response,
            };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    createQuizWithLlama: async (user, topic) => {
        try {
            let language = await languageRepository.getLanguagesById(
                user.languageId
            );
            let initialPrompt = await defaultPromptService.inferPromptForUser(
                user
            );
            if (!initialPrompt) {
                throw new Error("Couldn't get a default prompt");
            }

            // We hydrate it
            initialPrompt = await defaultPromptRepository.getPromptByIdForQuiz(
                initialPrompt.id
            );
            let openAIparams = initialPrompt.quizParams;

            let messages = promptService.assembleLlamaForCreatingQuiz(
                topic,
                initialPrompt,
                user,
                language
            );
            let requestParams = {
                // model: openAIparams?.Engine?.model || "gpt-3.5-turbo",
                model: "llama3-8b-8192",
                temperature: openAIparams.temperature || 0.7,
                max_tokens: openAIparams.maxTokens || 150,
                top_p: openAIparams.topP || 1.0,
                messages: messages,
                stream: false,
                stop: null,
            };
            const chatCompletion = await groq.chat.completions.create(
                requestParams
            );
            return {
                // 'session': session,
                chatCompletion: chatCompletion,
                fullRequest: requestParams,
                message: messages,
            };
        } catch (e) {
            console.log("error_groq");
            console.error(e);
            Sentry.captureException(e);
            return null;
        }
    },
    createQuizWithLlamaAndPrompt: async (user, prompt) => {
        try {
            let language = await languageRepository.getLanguagesById(
                user.languageId
            );
            let initialPrompt = await defaultPromptService.inferPromptForUser(
                user
            );
            if (!initialPrompt) {
                throw new Error("Couldn't get a default prompt");
            }

            // We hydrate it

            initialPrompt =
                await defaultPromptRepository.getPromptByIdForQuizUsingPrompt(
                    initialPrompt.id
                );

            let openAIparams = initialPrompt.quizPromptParams;

            let messages =
                promptService.assembleLlamaForCreatingQuizUsingPrompt(
                    prompt,
                    initialPrompt,
                    user,
                    language
                );
            let requestParams = {
                // model: openAIparams?.Engine?.model || "gpt-3.5-turbo",
                model: "llama3-8b-8192",
                temperature: openAIparams.temperature || 0.7,
                max_tokens: openAIparams.maxTokens || 150,
                top_p: openAIparams.topP || 1.0,
                messages: messages,
                stream: false,
                stop: null,
            };
            const chatCompletion = await groq.chat.completions.create(
                requestParams
            );
            return {
                // 'session': session,
                chatCompletion: chatCompletion,
                fullRequest: requestParams,
                message: messages,
            };
        } catch (e) {
            console.log("error_groq");
            console.error(e);
            Sentry.captureException(e);
            return null;
        }
    },
    quizExplainMoreUsingLlama: async (user, quizEntry) => {

        try {
             let language = await languageRepository.getLanguagesById(
                user.languageId
            );
            let initialPrompt = await defaultPromptService.inferPromptForUser(
                user
            );
            if (!initialPrompt) {
                throw new Error("Couldn't get a default prompt");
            }

            // We hydrate it
            initialPrompt =
                await defaultPromptRepository.getPromptByIdForQuizExplainMore(
                    initialPrompt.id
                );
            let openAIparams = initialPrompt.quizExplainMoreParams;
            let messages = promptService.assembleLlamaForQuizExplainMore(
                quizEntry,
                initialPrompt,
                user,
                language
            );


            let requestParams = {
                // model: openAIparams?.Engine?.model || "gpt-3.5-turbo",
                model: "llama3-8b-8192",
                temperature: openAIparams.temperature || 0.7,
                max_tokens: openAIparams.maxTokens || 150,
                top_p: openAIparams.topP || 1.0,
                messages: messages,
                stream: false,
                stop: null,
            };
            const chatCompletion = await groq.chat.completions.create(
                requestParams
            );
            return {
                text : chatCompletion.choices[0].message.content || '',
                chatCompletion: chatCompletion,
                fullRequest: requestParams,
                message: messages,
            };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    processStory: async (user, topic) => {
        let language = await languageRepository.getLanguagesById(
            user.languageId
        );
        let initialPrompt = await defaultPromptService.inferPromptForUser(user);
        if (!initialPrompt) {
            throw new Error("Couldn't get a default prompt");
        }

        // We hydrate it
        initialPrompt = await defaultPromptRepository.getPromptByIdForStory(
            initialPrompt.id
        );
        let engine = initialPrompt.storyParams.Engine;

        if (!engine) {
            throw new Error("Engine not found");
        }
        let messages = promptService.assembleChatGPTForStories(
            topic,
            initialPrompt,
            language,
            user
        );
        let openAIparams = initialPrompt.storyParams;


        let requestParams = {
                // model: openAIparams?.Engine?.model || "gpt-3.5-turbo",
            model: "llama3-8b-8192",
            temperature: openAIparams.temperature || 0.7,
            max_tokens: openAIparams.maxTokens || 150,
            top_p: openAIparams.topP || 1.0,
            messages: messages,
            stream: false,
            stop: null,
        };
        const chatCompletion = await groq.chat.completions.create(
            requestParams
        );

        return {
            text : chatCompletion.choices[0].message.content || '',
            chatCompletion: chatCompletion,
            fullRequest: requestParams,
            message: messages,
        };
    },

    convertMp3toText: async (audio, language) => {
        const tempFilePath = await base64ToTempFile(audio);
        const response = await groq.audio.transcriptions.create({
            model: "whisper-large-v3",
            file: fs.createReadStream(tempFilePath),
            language: language ? language : "en",
        });
        fs.unlinkSync(tempFilePath);

        return response.text;
    },

};

module.exports = groqService;
