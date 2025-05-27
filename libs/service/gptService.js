const sessionHelper = require("../helpers/session");
const Sentry = require("@sentry/node");
const sessionRepository = require("../repositories/session-repository");
const promptRepository = require("../repositories/prompt-repository");

const stringHelper = require("../helpers/string");
const promptService = require("./promptService");
const GroqService = require("./groqService");
const defaultPromptService = require("./defaultPromptService");

const PromptType = require("../helpers/enums/PromptType");
const languageRepository = require("../repositories/language-repository");
const defaultPromptRepository = require("../repositories/default-prompt-repository");
const SystemPromptRepository = require("../repositories/admin/system-prompt-repository");

const { createWriteStream } = require("fs");
const fs = require("fs");
const { Readable } = require("stream");
const temp = require("temp");

const OpenAI = require("openai");
const prisma = require("../lib-prisma");
const userRepository = require("../repositories/user-repository");
const templateHelper = require("../helpers/template");
const {EngineVendor} = require("@prisma/client");
const openai = new OpenAI({
    apiKey: process.env.OPENAI_SECRET_KEY,
});

const gptService = {

    process: async (user, message, type) => {
        let session = await gptService.getCurrentSession(user);
        if (!session) {
            throw new Error("Couldn't get a session");
        } else if (!session.DefaultPrompt) {
            throw new Error("Couldn't get a default prompt");
        } else if (!session.DefaultPrompt.mainParams) {
            throw new Error("Couldn't get the params");
        }

        let engine;
        if (type === PromptType.DEFAULT) {
            engine = session.DefaultPrompt?.mainParams?.Engine;
        } else if (type === PromptType.EXPLAIN_MORE) {
            engine = session.DefaultPrompt?.explainMoreParams?.Engine;
        } else if (type === PromptType.FUN_FACTS) {
            engine = session.DefaultPrompt?.funFactsParams?.Engine;
        }

        if (!engine) {
            throw new Error("Engine not found");
        }

        if (engine.engineVendor === EngineVendor.GPT){
            return await gptService.processChatGPT(user, message, session, type);
        }else if (engine.engineVendor === EngineVendor.GROQ) {
            return await GroqService.processWithLlama(user, message, session, type);
        }else{
            throw new Error("Engine not found");
        }
    },

    convertMp3toText: async (audio, language) => {
        // const stream = base64ToStream(audio);
        const tempFilePath = await base64ToTempFile(audio);
        const response = await openai.audio.transcriptions.create({
            model: "whisper-1",
            file: fs.createReadStream(tempFilePath),
            language: language ? language : "en",
        });

        fs.unlinkSync(tempFilePath);

        return response.text;
    },

    processGPT: async (user, message, session, type) => {
        try {
            // Now we have to get the latest briefed prompt and append it
            let lastProcessPrompt =
                await sessionRepository.getLastProcessedPrompt(user.id);
            let openAIparams;
            if (type === PromptType.DEFAULT) {
                openAIparams = session.DefaultPrompt.mainParams;
            } else if (type === PromptType.EXPLAIN_MORE) {
                openAIparams = session.DefaultPrompt.explainMoreParams;
            } else if (type === PromptType.FUN_FACTS) {
                openAIparams = session.DefaultPrompt.funFactsParams;
            }

            let requestParams = {
                model: openAIparams?.Engine?.model || "text-davinci-003",
                prompt: promptService.assemblePrompt(
                    session,
                    lastProcessPrompt,
                    message
                ),
                temperature: openAIparams.temperature || 0.9,
                max_tokens: openAIparams.maxTokens || 150,
                top_p: openAIparams.topP || 1,
                frequency_penalty: openAIparams.frequencyPenalty || 0,
                presence_penalty: openAIparams.presencePenalty || 0.6,
                best_of: openAIparams.bestOf || 1,
                stop: ["Human:", "AI:"],
            };

            let response = await openai.chat.completions.create(requestParams);

            return {
                text: response.choices[0].message.content,
                session: session,
                fullRequest: requestParams,
                ...response.usage,
            };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    continueProcessGPT: async (user, prompt) => {
        try {
            // Now we have to get the latest briefed prompt and append it
            let initialPrompt = await defaultPromptService.inferPromptForUser(
                user
            );
            if (!initialPrompt) {
                throw new Error("Couldn't get a default prompt");
            }

            // We hydrate it
            initialPrompt =
                await defaultPromptRepository.getPromptByIdForContinuePrompt(
                    initialPrompt.id
                );
            let openAiParams = initialPrompt.continuePromptParams;

            let requestParams = {
                model: openAiParams.Engine?.model || "text-davinci-003",
                // prompt: promptService.assembleContinuePrompt(prompt.response),
                temperature: openAiParams.temperature || 0.9,
                max_tokens: openAiParams.maxTokens || 150,
                top_p: openAiParams.topP || 1,
                messages: promptService.assembleContinuePrompt(prompt.response),
                frequency_penalty: openAiParams.frequencyPenalty || 0,
                presence_penalty: openAiParams.presencePenalty || 0.6,
                stop: ["Human:", "AI:"],
            };
            // console.log(requestParams)
            let response = await openai.chat.completions.create(requestParams);

            return {
                text: response.choices[0].message.content,
                // session: session,
                fullRequest: requestParams,
                ...response.usage,
            };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    processChatGPT: async (user, message, session, type) => {
        try {
            let lastProcessPrompt =
                await sessionRepository.getLastProcessedPrompt(user.id);
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

            let messages = await promptService.assembleChatGPTPrompt(
                session,
                lastProcessPrompt,
                message,
                type,
                language,
                user
            );

            let requestParams = {
                model: openAIparams?.Engine?.model || "gpt-3.5-turbo",
                temperature: openAIparams.temperature || 0.7,
                max_tokens: openAIparams.maxTokens || 150,
                top_p: openAIparams.topP || 1.0,
                frequency_penalty: openAIparams.frequencyPenalty || 0,
                presence_penalty: openAIparams.presencePenalty || 0.0,
                messages: messages,
            };
            let response = await openai.chat.completions.create(requestParams);

            return {
                text: response.choices[0].message.content,
                session: session,
                fullRequest: requestParams,
                ...response.usage,
            };
        } catch (e) {
            console.log(e);
            console.error(e.response);
            Sentry.captureException(e);
        }
    },

    // What we should do here is
    // 1. Get previous session processed Prompt (if any)
    // 2. Get all the prompts from this particular session
    // 3. Query OpenAI passing all these prompts
    // 4. Merge the new processed prompt with the prompt in stage 1
    // 5. Store the merged processed prompt in processPrompt field from the session
    // 6. Set the session processed to true

    processSessionPrompt: async (session) => {
        try {
            let lastProcessedPrompt =
                await sessionRepository.getLastProcessedPrompt(session.user);
            let digestedPrompts = await sessionHelper.promptsToDigest(
                session.Prompts
            );

            if (session.Prompts.length === 0) {
                let closedSession = await sessionRepository.closeSession(
                    session,
                    lastProcessedPrompt
                );
                return closedSession;
            }

            let user = await userRepository.findUserById(session.userId);
            if(!user){
                throw new Error("User not found");
            }


            // Interests
            let systemPromptInterests = await SystemPromptRepository.getPromptByType("CLOSE_DEFAULT_SESSION");
            if(!systemPromptInterests){
                throw new Error("User not found");
            }

            let nlpPrompt = templateHelper.replacePlaceholders(systemPromptInterests.prompt, {
                user: user,
                digestedPrompts
            });

            let response = await openai.chat.completions.create({
                model: systemPromptInterests.Engine.model || "gpt-4o",
                temperature: systemPromptInterests.temperature || 1,
                max_tokens: systemPromptInterests.maxTokens || null,
                top_p: systemPromptInterests.topP || 1,
                frequency_penalty: systemPromptInterests.frequencyPenalty || 0,
                presence_penalty: systemPromptInterests.presencePenalty || 0,
                messages: promptService.assembleChatGPTBriefedPrompt(
                    nlpPrompt
                ),
            });

            // Personal information
            let systemPromptPersonalInformation = await SystemPromptRepository.getPromptByType("CLOSE_SESSION_PERSONAL_INFORMATION");
            if(!systemPromptPersonalInformation){
                throw new Error("User not found");
            }

            let nlpPromptPersonalInformation = templateHelper.replacePlaceholders(systemPromptPersonalInformation.prompt, {
                user: user,
                digestedPrompts
            });

            let responsePersonalInformation = await openai.chat.completions.create({
                model: systemPromptPersonalInformation.Engine.model || "gpt-4o",
                temperature: systemPromptPersonalInformation.temperature || 1,
                max_tokens: systemPromptPersonalInformation.maxTokens || null,
                top_p: systemPromptPersonalInformation.topP || 1,
                frequency_penalty: systemPromptPersonalInformation.frequencyPenalty || 0,
                presence_penalty: systemPromptPersonalInformation.presencePenalty || 0,
                messages: promptService.assembleChatGPTBriefedPrompt(
                    nlpPromptPersonalInformation
                ),
            });

            let closedSession = await sessionRepository.closeSession(
                session,
                response.choices[0].message.content || "", // interests
                responsePersonalInformation.choices[0].message.content || "" // personal information
            );

            return closedSession;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    getCurrentSession: async (user) => {
        try {
            let currentSession = await sessionRepository.getLastUserSession(
                user
            );
            if (currentSession == null) {
                currentSession = await gptService.createSession(user);
            } else {
                if (currentSession.processed) {
                    currentSession = await gptService.createSession(user);
                } else {
                    let diffMinutes =
                        Math.abs(
                            new Date(currentSession.updatedAt) - new Date()
                        ) /
                        (60 * 1000);
                    if (diffMinutes > process.env.MINUTES_PER_SESSION) {
                        currentSession = await gptService.createSession(user);
                    }
                }
            }

            return currentSession;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    createSession: async (user) => {
        try {
            let lastSession = await sessionRepository.getLastUserSession(user);

            //This trigger to process the last prompt session later on if is not the first one or it has not been processed yet.
            if (lastSession && !lastSession.processed) {
                await gptService.processSessionPrompt(lastSession);
            }

            // Here we infer the initial prompt in order to attach it to this session
            let initialPrompt = await defaultPromptService.inferPromptForUser(
                user
            );
            if (!initialPrompt) {
                throw new Error("Couldn't get a default prompt");
            }

            let newSession = await sessionRepository.createSessionForUser(
                user,
                initialPrompt
            );

            return newSession;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    processFactsUsingChatGPT: async (user, topic) => {
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
                model: "gpt-3.5-turbo-1106",
                temperature: openAiParams.temperature || 0.7,
                max_tokens: openAiParams.maxTokens || 250,
                top_p: openAiParams.topP || 1.0,
                frequency_penalty: openAiParams.frequencyPenalty || 0,
                presence_penalty: openAiParams.presencePenalty || 0.0,
                messages: messages,
                response_format: { type: "json_object" },
            };

            let response = await openai.chat.completions.create(requestParams);
            const textResponse = response.choices[0].message.content;
            const parsedResponse = JSON.parse(textResponse);
            console.log(textResponse);
            let facts = parsedResponse.facts;
            facts.forEach((fact) => {
                console.log(fact);
            });
            return {
                text: textResponse,
                fullRequest: requestParams,
                result: parsedResponse?.facts || parsedResponse,
                ...response.usage,
            };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    processFactsUsingChatGPTAndPrompt: async (user, prompt) => {
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
                model: "gpt-3.5-turbo-1106",
                temperature: openAiParams.temperature || 0.7,
                max_tokens: openAiParams.maxTokens || 250,
                top_p: openAiParams.topP || 1.0,
                frequency_penalty: openAiParams.frequencyPenalty || 0,
                presence_penalty: openAiParams.presencePenalty || 0.0,
                messages: messages,
                response_format: { type: "json_object" },
            };

            let response = await openai.chat.completions.create(requestParams);
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
                ...response.usage,
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

        // Here we have to assets the type of requests, but for now we are going to suppose
        // is always the main request
        if (engine.model === "gpt-3.5-turbo") {
            return await gptService.processStoryUsingChatGPT(
                user,
                topic,
                initialPrompt,
                language
            );
        } else {
            return await gptService.processStoryGPT(
                user,
                topic,
                initialPrompt,
                language,
                engine
            );
        }
    },

    processStoryGPT: async (user, topic, initialPrompt, language, engine) => {
        try {
            // const configuration = new Configuration({
            //   apiKey: process.env.OPENAI_API_KEY,
            // });
            // const openai = new OpenAIApi(configuration);

            let messages = promptService.assembleGPTForStories(
                topic,
                initialPrompt,
                language,
                user
            );
            let openAIparams = initialPrompt.storyParams;

            let requestParams = {
                model: engine.model || "text-davinci-003",
                prompt: messages,
                temperature: openAIparams.temperature || 0.9,
                max_tokens: openAIparams.maxTokens || 150,
                top_p: openAIparams.topP || 1,
                frequency_penalty: openAIparams.frequencyPenalty || 0,
                presence_penalty: openAIparams.presencePenalty || 0.6,
                best_of: openAIparams.bestOf || 1,
                stop: ["Human:", "AI:"],
            };
            if (
                engine.model === "gpt-4-1106-preview" ||
                engine.model === "gpt-3.5-turbo-1106"
            ) {
                requestParams.response_format = { type: "json_object" };
            }
            let response = await openai.chat.completions.create(requestParams);

            return {
                text: stringHelper.cleanString(
                    response.choices[0].message.content
                ),
                fullRequest: requestParams,
                initialPrompt: initialPrompt,
                ...response.usage,
            };
        } catch (e) {
            console.error(e.response.data);
            Sentry.captureException(e);
        }
    },
    processTypeOfStoryGPT: async (user, typeOfStory, storyParam) => {
        try {
            let session = await gptService.getCurrentSession(user);
            if (!session) {
                throw new Error("Couldn't get a session");
            }

            // const configuration = new Configuration({
            //   apiKey: process.env.OPENAI_API_KEY,
            // });
            // const openai = new OpenAIApi(configuration);

            let initialPrompt = await defaultPromptService.inferPromptForUser(
                user
            );
            if (!initialPrompt) {
                throw new Error("Couldn't get a default prompt");
            }

            initialPrompt =
                await defaultPromptRepository.getPromptByIdForCustomStory(
                    initialPrompt.id
                );
            let openAIparams = initialPrompt.customStoryParams;

            const messages = promptService.assembleChatGPTForTypeOfStory(
                user,
                typeOfStory,
                storyParam,
                user.Language,
                initialPrompt
            );

            let requestParams = {
                model: "gpt-3.5-turbo-1106",
                temperature: openAIparams.temperature || 0.7,
                max_tokens: openAIparams.maxTokens || 550,
                top_p: openAIparams.topP || 1.0,
                frequency_penalty: openAIparams.frequencyPenalty || 0,
                presence_penalty: openAIparams.presencePenalty || 0.0,
                messages: messages,
                stop: ["Human:", "AI:"],
                response_format: { type: "json_object" },
            };
            let response = await openai.chat.completions.create(requestParams);

            const textResponse = response.choices[0].message.content;
            const parsedResponse = JSON.parse(textResponse);
            console.log(parsedResponse);
            return {
                text: response.choices[0].message.content,
                fullRequest: requestParams,
                result: parsedResponse,
                ...response.usage,
            };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    followStoryGPT: async (user, prompt, text) => {
        try {
            // const configuration = new Configuration({
            //   apiKey: process.env.OPENAI_API_KEY,
            // });
            // const openai = new OpenAIApi(configuration);

            let initialPrompt = await defaultPromptService.inferPromptForUser(
                user
            );
            if (!initialPrompt) {
                throw new Error("Couldn't get a default prompt");
            }

            initialPrompt =
                await defaultPromptRepository.getPromptByIdForCustomStory(
                    initialPrompt.id
                );
            let openAIparams = initialPrompt.customStoryParams;

            let messages = promptService.assembleChatGPTForFollowStory(
                text,
                prompt.response,
                user.Language
            );

            let requestParams = {
                model: openAIparams.Engine.model,
                temperature: openAIparams.temperature || 0.7,
                max_tokens: openAIparams.maxTokens || 550,
                top_p: openAIparams.topP || 1.0,
                frequency_penalty: openAIparams.frequencyPenalty || 0,
                presence_penalty: openAIparams.presencePenalty || 0.0,
                messages: messages,
            };
            let response = await openai.chat.completions.create(requestParams);
            const textResponse = response.choices[0].message.content;
            console.log(textResponse);
            // const parsedResponse = JSON.parse(textResponse);

            return {
                text: response.choices[0].message.content,
                fullRequest: requestParams,
                // result : parsedResponse,
                initialPrompt: initialPrompt,
                ...response.usage,
            };
        } catch (e) {
            console.log(e);
            console.error(e);
            Sentry.captureException(e);
        }
    },
    processStoryUsingChatGPT: async (user, topic, initialPrompt, language) => {
        try {
            let messages = promptService.assembleChatGPTForStories(
                topic,
                initialPrompt,
                language,
                user
            );
            let openAIparams = initialPrompt.storyParams;

            let requestParams = {
                model: "gpt-3.5-turbo",
                temperature: openAIparams.temperature || 0.7,
                max_tokens: openAIparams.maxTokens || 250,
                top_p: openAIparams.topP || 1.0,
                frequency_penalty: openAIparams.frequencyPenalty || 0,
                presence_penalty: openAIparams.presencePenalty || 0.0,
                messages: messages,
            };

            let response = await openai.chat.completions.create(requestParams);

            return {
                text: response.choices[0].message.content,
                fullRequest: requestParams,
                initialPrompt: initialPrompt,
                ...response.usage,
            };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    createQuizUsingChatGPT: async (user, topic) => {
        try {
            // const configuration = new Configuration({
            //   apiKey: process.env.OPENAI_API_KEY,
            // });
            // const openai = new OpenAIApi(configuration);
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
            let messages = promptService.assembleChatGPTForCreatingQuiz(
                topic,
                initialPrompt,
                language,
                user
            );

            let requestParams = {
                model: "gpt-3.5-turbo",
                temperature: openAIparams.temperature || 0.7,
                max_tokens: openAIparams.maxTokens || 250,
                top_p: openAIparams.topP || 1.0,
                frequency_penalty: openAIparams.frequencyPenalty || 0,
                presence_penalty: openAIparams.presencePenalty || 0.0,
                messages: messages,
            };

            let response = await openai.chat.completions.create(requestParams);
            // console.log(response.choices[0].message.content)
            return {
                text: response.choices[0].message.content,
                fullRequest: requestParams,
                ...response.usage,
            };
        } catch (e) {
            console.log("error");
            console.error(e);
            Sentry.captureException(e);
        }
    },
    createQuizUsingChatGPTAndPrompt: async (user, prompt) => {
        try {
            // const configuration = new Configuration({
            //   apiKey: process.env.OPENAI_API_KEY,
            // });
            // const openai = new OpenAIApi(configuration);
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
                promptService.assembleChatGPTForCreatingQuizAndPrompt(
                    prompt,
                    initialPrompt,
                    language,
                    user
                );

            let requestParams = {
                model: "gpt-3.5-turbo",
                temperature: openAIparams.temperature || 0.7,
                max_tokens: openAIparams.maxTokens || 250,
                top_p: openAIparams.topP || 1.0,
                frequency_penalty: openAIparams.frequencyPenalty || 0,
                presence_penalty: openAIparams.presencePenalty || 0.0,
                messages: messages,
            };

            let response = await openai.chat.completions.create(requestParams);
            // console.log(response.choices[0].message.content)
            return {
                text: response.choices[0].message.content,
                fullRequest: requestParams,
                ...response.usage,
            };
        } catch (e) {
            console.log("error");
            console.error(e);
            Sentry.captureException(e);
        }
    },

    quizExplainMoreUsingChatGPT: async (user, quizEntry) => {
        try {
            // const configuration = new Configuration({
            //   apiKey: process.env.OPENAI_API_KEY,
            // });
            // const openai = new OpenAIApi(configuration);
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
            let messages = promptService.assembleChatGPTForQuizExplainMore(
                quizEntry,
                initialPrompt,
                language,
                user
            );

            let requestParams = {
                model: "gpt-3.5-turbo",
                temperature: openAIparams.temperature || 0.7,
                max_tokens: openAIparams.maxTokens || 250,
                top_p: openAIparams.topP || 1.0,
                frequency_penalty: openAIparams.frequencyPenalty || 0,
                presence_penalty: openAIparams.presencePenalty || 0.0,
                messages: messages,
            };
            let response = await openai.chat.completions.create(requestParams);

            return {
                text: response.choices[0].message.content,
                fullRequest: requestParams,
                ...response.usage,
            };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    processIdle: async (user) => {
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

            initialPrompt = await defaultPromptRepository.getPromptForIdle(
                initialPrompt.id
            );

            let conversation = await promptRepository.getLastNPrompts(
                user.id,
                20
            );
            conversation = conversation.map((x) => {
                return {
                    createdAt: x.createdAt,
                    question: x.request,
                    answer: x.response,
                };
            });

            conversation = JSON.stringify({
                conversation: conversation,
            });

            let openAIparams = initialPrompt.IdleParams;
            let messages = promptService.assembleChatGPTForIdle(
                conversation,
                initialPrompt,
                language,
                user
            );

            let requestParams = {
                model: openAIparams?.Engine?.model || "gpt-3.5-turbo",
                temperature: openAIparams.temperature || 0.7,
                max_tokens: openAIparams.maxTokens || 150,
                top_p: openAIparams.topP || 1.0,
                frequency_penalty: openAIparams.frequencyPenalty || 0,
                presence_penalty: openAIparams.presencePenalty || 0.0,
                messages: messages,
            };
            let response = await openai.chat.completions.create(requestParams);

            return {
                initialPrompt: initialPrompt,
                text: response.choices[0].message.content,
                fullRequest: requestParams,
                ...response.usage,
            };
        } catch (e) {
            console.log(e);
            console.error(e.response);
            Sentry.captureException(e);
        }
    },

    processAssistant: async (user, message) => {
        let threadId = await userRepository.getUserThreadId(user.id);

        if (!threadId) {
            threadId = await promptsToAssistant(user);
        }

        const openAiMessage = await openai.beta.threads.messages.create(
            threadId,
            {
                role: "user",
                content: message,
            }
        );

        const run = await openai.beta.threads.runs.create(threadId, {
            assistant_id: process.env.ASSISTANT_ID,
        });

        let runStatus = await openai.beta.threads.runs.retrieve(
            threadId,
            run.id
        );

        while (runStatus.status !== "completed") {
            runStatus = await openai.beta.threads.runs.retrieve(
                threadId,
                run.id
            );
        }

        const response = await openai.beta.threads.messages.list(threadId);

        return {
            text: response.data[0].content[0].text.value,
            usage: runStatus.usage,
        };
    },
    generateContext: async (user, text) => {
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
                await defaultPromptRepository.getPromptByIdForContext(
                    initialPrompt.id
                );
            let openAiParams = initialPrompt.contextParams;
            let messages = promptService.assembleChatGPTForContext(
                text,
                initialPrompt,
                language,
                user
            );

            let requestParams = {
                model: openAiParams?.Engine?.model | "gpt-3.5-turbo-1106",
                temperature: openAiParams.temperature || 0.7,
                max_tokens: openAiParams.maxTokens || 250,
                top_p: openAiParams.topP || 1.0,
                frequency_penalty: openAiParams.frequencyPenalty || 0,
                presence_penalty: openAiParams.presencePenalty || 0.0,
                messages: messages,
                response_format: { type: "json_object" },
            };

            let response = await openai.chat.completions.create(requestParams);
            const textResponse = response.choices[0].message.content || '';
            const parsedResponse = JSON.parse(textResponse);

            return parsedResponse;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    generateEmojis: async (user, text) => {
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
                await defaultPromptRepository.getPromptByIdForEmojis(
                    initialPrompt.id
                );
            let openAiParams = initialPrompt.emojisParams;
            let messages = promptService.assembleChatGPTForEmojis(
                text,
                initialPrompt,
                language,
                user
            );

            let requestParams = {
                model: openAiParams?.Engine?.model | "gpt-3.5-turbo-1106",
                temperature: openAiParams.temperature || 0.7,
                max_tokens: openAiParams.maxTokens || 250,
                top_p: openAiParams.topP || 1.0,
                frequency_penalty: openAiParams.frequencyPenalty || 0,
                presence_penalty: openAiParams.presencePenalty || 0.0,
                messages: messages,
                response_format: { type: "json_object" },
            };

            let response = await openai.chat.completions.create(requestParams);
            const textResponse = response.choices[0].message.content;
            const parsedResponse = JSON.parse(textResponse);

            return parsedResponse;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
};

function base64ToStream(base64String) {
    const buffer = Buffer.from(base64String, "base64");
    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);
    return readableStream;
}
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

async function promptsToAssistant(user) {
    const thread = await openai.beta.threads.create();
    await userRepository.updateThreadId(user.id, thread.id);

    const prompts = await promptRepository.getUserDefaultPrompt(user.id);
    if (prompts.length > 0) {
        let message =
            "This is the history of user's asking, 'user:' meant its from the user and 'assistants:' meant its from gpt.\n";
        for (const prompt of prompts) {
            message =
                message +
                "user: " +
                prompt.request +
                "\nassistant: " +
                prompt.response +
                "\n";
        }
        const historyMessage = await openai.beta.threads.messages.create(
            thread.id,
            { role: "user", content: message }
        );
    }

    return thread.id;
}

module.exports = gptService;
