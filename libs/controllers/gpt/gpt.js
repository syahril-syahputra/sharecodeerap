const render = require("../../helpers/render");
const statuscodes = require("../../helpers/statuscodes");
const sessionRepository = require("../../repositories/session-repository");
const promptRepository = require("../../repositories/prompt-repository");
const topicRepository = require("../../repositories/topic-repository");
const settingsRepository = require("../../repositories/settings-repository");
const quizEntryRepository = require("../../repositories/quiz-entry-repository");
const promptService = require("../../service/promptService");
const gptService = require("../../service/gptService");
const dalleService = require("../../service/dalleService");
const metadataGptService = require("../../service/metadataGptService");
const userLevelService = require("../../service/userLevelsService");
const usageService = require("../../service/usageService");
const stringHelper = require("../../helpers/string");
const PromptType = require("../../helpers/enums/PromptType");
const Sentry = require("@sentry/node");
const crypto = require("crypto");
const Joi = require("joi");
const fs = require("fs");
const logService = require("../../service/logService");
const { LogType, STT_Type} = require("@prisma/client");
const redis = require("../../lib-ioredis");
const languageRepository = require("../../repositories/language-repository");
const groqService = require("../../service/groqService");
const DeepgramService = require("../../service/deepgramService");
const contextPromptFormat = require("../../helpers/context-format");

function responseToArray(response) {
    response = response.replace(/\*/g, '').replace(/###/g, '');;
    let paragraphs = response.split(/\n\n|\n/);

    let result = [];
    let buffer = "";

    paragraphs.forEach((paragraph) => {
        if (
            /^\d+\./.test(paragraph) ||
            /^-/.test(paragraph) ||
            /^\*/.test(paragraph)
        ) {
            if (buffer.length > 0) {
                result.push(buffer.trim());
                buffer = "";
            }
            result.push(paragraph.trim());
        } else {
            let sentences = paragraph.match(/[^.!?]+[.!?]+/g);

            if (!sentences) {
                result.push(paragraph.trim());
                return;
            }

            sentences = sentences.map((sentence) => sentence.trim());

            result.push(...sentences);
        }
    });
    if (buffer.length > 0) {
        result.push(buffer.trim());
    }

    return result;
}

const gptController = {

    process: async (req, res) => {
        let start = new Date().getTime();
        try {
            if (
                req.user.account.subscriptionStatus !== "active" &&
                req.user.account.subscriptionStatus !== "trialing"
            ) {
                render(res, 400, statuscodes.SUBSCRIPTION_NOT_ACTIVE, {
                    text: "Subscription not active",
                });
                return;
            } else if (
                !(await usageService.accountHasEnoughTokens(req.user.account))
            ) {
                render(res, 400, statuscodes.NOT_ENOUGH_TOKENS, {
                    text: "Looks like you run out of tokens this month",
                });
                return;
            } else if (
                !req.body.unique_token ||
                req.body.unique_token.length === 0
            ) {
                render(res, 400, statuscodes.INVALID_TOKEN, {
                    text: "Invalid unique token",
                });
                return;
            }

            let startTime = Date.now();

            let response = await gptService.process(
                req.user,
                req.body.message,
                PromptType.DEFAULT
            );

            await redis.publish(
                "mattermost:userquestion",
                JSON.stringify({
                    user: req.user,
                    question: req.body.message,
                    answer: response.text || "",
                })
            );
            const contextPrompt = await gptService.generateContext(
                req.user,
                req.body.message
            );

            let sttSetting = await settingsRepository.getSettingByName("STT");
            let ttsSetting = await settingsRepository.getSettingByName("TTS");
            let engineName = response.session?.DefaultPrompt?.mainParams?.Engine?.model || "Undefined engine"


            let prompt = await promptService.createPrompt({
                sessionId: response.session.id,
                request: req.body.message,
                response: response.text || "",
                responseTime: Date.now() - startTime || 0,
                promptToken: response.prompt_tokens || 0,
                completionToken: response.completion_tokens || 0,
                totalTokens: response.total_tokens || 0,
                type: PromptType.DEFAULT,
                isCorrect: null,
                userId: req.user.id,
                funFactsScore: null,
                learnMoreScore: null,
                metadataToken: req.body.unique_token,
                sttEngine: sttSetting.sttType,
                ttsEngine: ttsSetting.ttsType,
                llmEngine: engineName,
                fullRequest: JSON.stringify({
                    request: response.fullRequest,
                    language: req.user.Language,
                    voice: req.user.voiceCode || "",
                }),
                Context: {
                    create: {
                        context: contextPrompt.context,
                        emoji: contextPrompt.text.emoji,
                        title: contextPrompt.text.title,
                    },
                },
            });
            delete prompt.fullRequest;

            await sessionRepository.sessionUpdated(response.session);
            await userLevelService.updateUserLevel(req.user);
            await userLevelService.updateQuestionAsked(req.user);

            await logService.createLog(req, {
                type: LogType.GPT,
                message: `Create process GPT by user with id : ${req.user.id}`,
                promptId: prompt.id,
            });

            render(res, 200, statuscodes.OK, prompt);
        } catch (e) {
            let responseTime = new Date().getTime() - start;
            console.error(e?.response);
            await logService.createErrorLog(req, {
                message: e.message,
                description: `GPT Process \n ${e.stack}`,
                type: "GPT",
                responseTime: parseInt(responseTime.toFixed(2)),
            });

            await redis.publish(
                "mattermost:usererror",
                JSON.stringify({
                    user: req.user,
                    error: e.message,
                })
            );

            // Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

    openAiSttProcess: async (req, res) => {
        let start = new Date().getTime();
        try {
            // console.log(req.body.toString('base64'))
            if (
                req.user.account.subscriptionStatus !== "active" &&
                req.user.account.subscriptionStatus !== "trialing"
            ) {
                render(res, 400, statuscodes.SUBSCRIPTION_NOT_ACTIVE, {
                    text: "Subscription not active",
                });
                return;
            } else if (
                !(await usageService.accountHasEnoughTokens(req.user.account))
            ) {
                render(res, 400, statuscodes.NOT_ENOUGH_TOKENS, {
                    text: "Looks like you run out of tokens this month",
                });
                return;
            } else if (
                !req.headers.unique_token ||
                req.headers.unique_token.length === 0
            ) {
                render(res, 400, statuscodes.INVALID_TOKEN, {
                    text: "Invalid unique token",
                });
                return;
            }
            // console.log(req.body)
            let startTime = Date.now();
            const language = await languageRepository.getLanguagesById(
                req.user.languageId
            );
            const message = await groqService.convertMp3toText(
                req.body.toString("base64"),
                language.iso
            );
            // console.log(message, 'here')
            let response = await gptService.process(
                req.user,
                message,
                PromptType.DEFAULT
            );
            const contextPrompt = await gptService.generateContext(
                req.user,
                message
            );

            // console.log(message)
            let prompt = await promptService.createPrompt({
                sessionId: response.session.id,
                request: message,
                response: response.text || "",
                responseTime: Date.now() - startTime || 0,
                promptToken: response.prompt_tokens || 0,
                completionToken: response.completion_tokens || 0,
                totalTokens: response.total_tokens || 0,
                type: PromptType.DEFAULT,
                isCorrect: null,
                userId: req.user.id,
                funFactsScore: null,
                learnMoreScore: null,
                metadataToken: req.body.unique_token,
                fullRequest: JSON.stringify({
                    request: response.fullRequest,
                    language: req.user.Language,
                    voice: req.user.voiceCode || "",
                }),
                Context: {
                    create: {
                        context: contextPrompt.context,
                        emoji: contextPrompt.text.emoji,
                        title: contextPrompt.text.title,
                    },
                },
            });
            delete prompt.fullRequest;

            await redis.publish(
                "mattermost:userquestion",
                JSON.stringify({
                    user: req.user,
                    question: message,
                    answer: response.text || "",
                })
            );

            await sessionRepository.sessionUpdated(response.session);
            await userLevelService.updateUserLevel(req.user);
            await userLevelService.updateQuestionAsked(req.user);

            await logService.createLog(req, {
                type: LogType.GPT,
                message: `Create process GPT using OpenAi STT by user with id : ${req.user.id}`,
                promptId: prompt.id,
            });

            render(res, 200, statuscodes.OK, prompt);
        } catch (e) {
            let responseTime = new Date().getTime() - start;
            console.log(e);
            console.error(e?.response);
            console.log(e.message);
            await logService.createErrorLog(req, {
                message: e.message,
                description: `GPT Process \n ${e.stack}`,
                type: "GPT",
                responseTime: parseInt(responseTime.toFixed(2)),
            });

            await redis.publish(
                "mattermost:usererror",
                JSON.stringify({
                    user: req.user,
                    error: e.message,
                })
            );

            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

    // This one is the method that is being called polling
    // to get the response from the openAi
    openAiProcessByReference: async (req, res) => {
        try {
            if (
                req.user.account.subscriptionStatus !== "active" &&
                req.user.account.subscriptionStatus !== "trialing"
            ) {
                render(res, 400, statuscodes.SUBSCRIPTION_NOT_ACTIVE, {
                    text: "Subscription not active",
                });
                return;
            }

            let prompt = await promptRepository.getPromptsByReference(
                req.body.reference
            );

            if (prompt.response !== undefined) {
                prompt.response = responseToArray(prompt.response);
            }
            prompt = contextPromptFormat(prompt);

            render(res, 200, statuscodes.OK, prompt);
        } catch (e) {
            let responseTime = new Date().getTime();
            console.log(e);
            console.error(e?.response);
            console.log(e.message);

            await logService.createErrorLog(req, {
                message: e.message,
                description: `STT Process using openAi new Flow \n ${e.stack}`,
                type: "GPT",
                responseTime: parseInt(responseTime.toFixed(2)),
            });

            await redis.publish(
                "mattermost:usererror",
                JSON.stringify({
                    user: req.user,
                    error: e.message,
                })
            );

            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

    sttProcess: async (req, res) => {
        let start = new Date().getTime();
        try {
            if (
                req.user.account.subscriptionStatus !== "active" &&
                req.user.account.subscriptionStatus !== "trialing"
            ) {
                render(res, 400, statuscodes.SUBSCRIPTION_NOT_ACTIVE, {
                    text: "Subscription not active",
                });
                return;
            } else if (
                !(await usageService.accountHasEnoughTokens(req.user.account))
            ) {
                render(res, 400, statuscodes.NOT_ENOUGH_TOKENS, {
                    text: "Looks like you run out of tokens this month",
                });
                return;
            }
            if (!req.body || Object.keys(req.body).length === 0) {
                await redis.publish(
                    "mattermost:usererror",
                    JSON.stringify({
                        user: req.user,
                        error: "Bad File Requested",
                    })
                );
                render(res, 400, statuscodes.BAD_REQUEST, {
                    text: "Please attach your file!",
                });
                return;
            }

            const randString = crypto.randomBytes(16).toString("hex");

            const language = await languageRepository.getLanguagesById(
                req.user.languageId
            );

            // STT process
            let sttSetting = await settingsRepository.getSettingByName("STT");
            let message = "";
            if(sttSetting.sttType === STT_Type.MOBILE_APP){
                render(res, 400, statuscodes.BAD_REQUEST, {
                    text: "STT Type mobile app, don't use this endpoint but process, as you have done the STT locally",
                });
                return;
            }else if(sttSetting.sttType === STT_Type.GROQ_WHISPER){
                message = await groqService.convertMp3toText(
                    req.body.toString("base64"),
                    language.iso
                );
            }else if(sttSetting.sttType === STT_Type.DEEPGRAM_API){
                message = await DeepgramService.convertSpeechtoText(
                    req.body
                );
            }else{
                render(res, 400, statuscodes.INTERNAL_ERROR, {
                    text: "Invalid STT Engine",
                });
                return;
            }
            // Fi STT process

            let startTime = Date.now();
            render(res, 200, statuscodes.OK, {
                message,
                references: randString,
            });

            let response = await gptService.process(
                req.user,
                message,
                PromptType.DEFAULT
            );

            const contextPrompt = await gptService.generateContext(
                req.user,
                message
            );

            let ttsSetting = await settingsRepository.getSettingByName("TTS");
            let engineName = response.session?.DefaultPrompt?.mainParams?.Engine?.model || "Undefined engine"

            let prompt = await promptService.createPrompt({
                sessionId: response.session.id,
                request: message,
                response: response.text || "",
                responseTime: Date.now() - startTime || 0,
                promptToken: response.prompt_tokens || 0,
                completionToken: response.completion_tokens || 0,
                totalTokens: response.total_tokens || 0,
                type: PromptType.DEFAULT,
                isCorrect: null,
                userId: req.user.id,
                funFactsScore: null,
                learnMoreScore: null,
                metadataToken: randString,
                sttEngine: sttSetting.sttType,
                ttsEngine: ttsSetting.ttsType,
                llmEngine: engineName,
                fullRequest: JSON.stringify({
                    request: response.fullRequest,
                    language: req.user.Language,
                    voice: req.user.voiceCode || "",
                }),
                Context: {
                    create: {
                        context: contextPrompt.context,
                        emoji: contextPrompt.text.emoji,
                        title: contextPrompt.text.title,
                    },
                },
            });

            await gptController.directDefaultMetada({
                ...req,
                body: {
                    unique_token: randString,
                    message: message,
                },
            });

            delete prompt.fullRequest;

            await redis.publish(
                "mattermost:userquestion",
                JSON.stringify({
                    user: req.user,
                    question: message,
                    answer: response.text || "",
                })
            );

            // console.log(response);
            await sessionRepository.sessionUpdated(response.session);
            await userLevelService.updateUserLevel(req.user);
            await userLevelService.updateQuestionAsked(req.user);

            await logService.createLog(req, {
                type: LogType.GPT,
                message: `Create process GPT using OpenAi STT (new flow) by user with id : ${req.user.id}`,
                promptId: prompt.id,
            });

        } catch (e) {
            let responseTime = new Date().getTime() - start;
            console.log(e);

            await logService.createErrorLog(req, {
                message: e.message,
                description: `STT Process using openAi \n ${e.stack}`,
                type: "GPT",
                responseTime: parseInt(responseTime.toFixed(2)),
            });

            await redis.publish(
                "mattermost:usererror",
                JSON.stringify({
                    user: req.user,
                    error: e.message,
                })
            );

            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
    sttProcessEmoji: async (req, res) => {
        let start = new Date().getTime();
        try {
            if (
                req.user.account.subscriptionStatus !== "active" &&
                req.user.account.subscriptionStatus !== "trialing"
            ) {
                render(res, 400, statuscodes.SUBSCRIPTION_NOT_ACTIVE, {
                    text: "Subscription not active",
                });
                return;
            } else if (
                !(await usageService.accountHasEnoughTokens(req.user.account))
            ) {
                render(res, 400, statuscodes.NOT_ENOUGH_TOKENS, {
                    text: "Looks like you run out of tokens this month",
                });
                return;
            }

            const randString = crypto.randomBytes(16).toString("hex");

            const language = await languageRepository.getLanguagesById(
                req.user.languageId
            );

            const message = await groqService.convertMp3toText(
                req.body.toString("base64"),
                language.iso
            );

            let startTime = Date.now();

            const emojis = await gptService.generateEmojis(
                req.user,
                message
            );


            render(res, 200, statuscodes.OK, {
                ...emojis,
                references: randString,
            });



            await redis.publish(
                "mattermost:usergenerateemoji",
                JSON.stringify({
                    user: req.user,
                    message: `${req.user.email} created emoji topics : ${emojis.emojis.map(item => item.emoji).join(', ')}`,
                })
            );

            // console.log(response);

        } catch (e) {
            let responseTime = new Date().getTime() - start;
            console.log(e);

            await logService.createErrorLog(req, {
                message: e.message,
                description: `STT Process using openAi \n ${e.stack}`,
                type: "GPT",
                responseTime: parseInt(responseTime.toFixed(2)),
            });

            await redis.publish(
                "mattermost:usererror",
                JSON.stringify({
                    user: req.user,
                    error: e.message,
                })
            );

            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

    sttProccessLlama: async (req, res) => {
        let start = new Date().getTime();
        try {
            if (
                req.user.account.subscriptionStatus !== "active" &&
                req.user.account.subscriptionStatus !== "trialing"
            ) {
                render(res, 400, statuscodes.SUBSCRIPTION_NOT_ACTIVE, {
                    text: "Subscription not active",
                });
                return;
            } else if (
                !(await usageService.accountHasEnoughTokens(req.user.account))
            ) {
                render(res, 400, statuscodes.NOT_ENOUGH_TOKENS, {
                    text: "Looks like you run out of tokens this month",
                });
                return;
                ``;
            }

            const randString = crypto.randomBytes(16).toString("hex");

            const language = await languageRepository.getLanguagesById(
                req.user.languageId
            );
            const message = await groqService.convertMp3toText(
                req.body.toString("base64"),
                language.iso
            );

            let startTime = Date.now();

            let response = await groqService.processWithLlama(
                req.user,
                message,
                PromptType.DEFAULT
            );

            render(res, 200, statuscodes.OK, {
                message,
                references: randString,
            });
            const contextPrompt = await gptService.generateContext(
                req.user,
                message
            );

            let prompt = await promptService.createPrompt({
                sessionId: response.session?.id ?? null,
                request: message,
                response:
                    response.chatCompletion.choices[0].message.content ?? "",
                responseTime: Date.now() - startTime || 0,
                promptToken: response.chatCompletion.usage.prompt_tokens || 0,
                completionToken:
                    response.chatCompletion.usage.completion_tokens || 0,
                totalTokens: response.chatCompletion.usage.total_tokens || 0,
                type: PromptType.DEFAULT,
                isCorrect: null,
                userId: req.user.id,
                funFactsScore: null,
                learnMoreScore: null,
                metadataToken: randString,
                fullRequest: JSON.stringify({
                    request: req.fullRequest,
                    language: req.user.Language,
                    voice: req.user.voiceCode || "",
                }),
                Context: {
                    create: {
                        context: contextPrompt.context,
                        emoji: contextPrompt.text.emoji,
                        title: contextPrompt.text.title,
                    },
                },
            });

            await gptController.directDefaultMetada({
                ...req,
                body: {
                    unique_token: randString,
                    message: message,
                },
            });

            delete prompt.fullRequest;

            await redis.publish(
                "mattermost:userquestion",
                JSON.stringify({
                    user: req.user,
                    question: message,
                    answer: response.chatCompletion.choices[0].message.content,
                })
            );

            // console.log(response);
            await sessionRepository.sessionUpdated(response.session);
            await userLevelService.updateUserLevel(req.user);
            await userLevelService.updateQuestionAsked(req.user);

            await logService.createLog(req, {
                type: LogType.GPT,
                message: `Create process Groq using OpenAi STT (new flow) by user with id : ${req.user.id}`,
                promptId: prompt.id,
            });
        } catch (e) {
            let responseTime = new Date().getTime() - start;
            console.log(e);

            await logService.createErrorLog(req, {
                message: e.message,
                description: `STT Process using openAi \n ${e.stack}`,
                type: "GPT",
                responseTime: parseInt(responseTime.toFixed(2)),
            });

            await redis.publish(
                "mattermost:usererror",
                JSON.stringify({
                    user: req.user,
                    error: e.message,
                })
            );

            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

    sttProccessLlama: async (req, res) => {
        let start = new Date().getTime();
        try {
            if (
                req.user.account.subscriptionStatus !== "active" &&
                req.user.account.subscriptionStatus !== "trialing"
            ) {
                render(res, 400, statuscodes.SUBSCRIPTION_NOT_ACTIVE, {
                    text: "Subscription not active",
                });
                return;
            } else if (
                !(await usageService.accountHasEnoughTokens(req.user.account))
            ) {
                render(res, 400, statuscodes.NOT_ENOUGH_TOKENS, {
                    text: "Looks like you run out of tokens this month",
                });
                return;
                ``;
            }

            const randString = crypto.randomBytes(16).toString("hex");

            const language = await languageRepository.getLanguagesById(
                req.user.languageId
            );
            const message = await groqService.convertMp3toText(
                req.body.toString("base64"),
                language.iso
            );

            let startTime = Date.now();

            let response = await groqService.processWithLlama(
                req.user,
                message,
                PromptType.DEFAULT
            );

            render(res, 200, statuscodes.OK, {
                message,
                references: randString,
            });
            const contextPrompt = await gptService.generateContext(
                req.user,
                message
            );

            let prompt = await promptService.createPrompt({
                sessionId: response.session?.id ?? null,
                request: message,
                response:
                    response.chatCompletion.choices[0].message.content ?? "",
                responseTime: Date.now() - startTime || 0,
                promptToken: response.chatCompletion.usage.prompt_tokens || 0,
                completionToken:
                    response.chatCompletion.usage.completion_tokens || 0,
                totalTokens: response.chatCompletion.usage.total_tokens || 0,
                type: PromptType.DEFAULT,
                isCorrect: null,
                userId: req.user.id,
                funFactsScore: null,
                learnMoreScore: null,
                metadataToken: randString,
                fullRequest: JSON.stringify({
                    request: req.fullRequest,
                    language: req.user.Language,
                    voice: req.user.voiceCode || "",
                }),
                Context: {
                    create: {
                        context: contextPrompt.context,
                        emoji: contextPrompt.text.emoji,
                        title: contextPrompt.text.title,
                    },
                },
            });

            await gptController.directDefaultMetada({
                ...req,
                body: {
                    unique_token: randString,
                    message: message,
                },
            });

            delete prompt.fullRequest;

            await redis.publish(
                "mattermost:userquestion",
                JSON.stringify({
                    user: req.user,
                    question: message,
                    answer: response.chatCompletion.choices[0].message.content,
                })
            );

            // console.log(response);
            await sessionRepository.sessionUpdated(response.session);
            await userLevelService.updateUserLevel(req.user);
            await userLevelService.updateQuestionAsked(req.user);

            await logService.createLog(req, {
                type: LogType.GPT,
                message: `Create process Groq using OpenAi STT (new flow) by user with id : ${req.user.id}`,
                promptId: prompt.id,
            });
        } catch (e) {
            let responseTime = new Date().getTime() - start;
            console.log(e);

            await logService.createErrorLog(req, {
                message: e.message,
                description: `STT Process using openAi \n ${e.stack}`,
                type: "GPT",
                responseTime: parseInt(responseTime.toFixed(2)),
            });

            await redis.publish(
                "mattermost:usererror",
                JSON.stringify({
                    user: req.user,
                    error: e.message,
                })
            );

            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

    sttProccessWhisper: async (req, res) => {
        let start = new Date().getTime();
        try {
            if (
                req.user.account.subscriptionStatus !== "active" &&
                req.user.account.subscriptionStatus !== "trialing"
            ) {
                render(res, 400, statuscodes.SUBSCRIPTION_NOT_ACTIVE, {
                    text: "Subscription not active",
                });
                return;
            } else if (
                !(await usageService.accountHasEnoughTokens(req.user.account))
            ) {
                render(res, 400, statuscodes.NOT_ENOUGH_TOKENS, {
                    text: "Looks like you run out of tokens this month",
                });
                return;
                ``;
            }

            const randString = crypto.randomBytes(16).toString("hex");

            const language = await languageRepository.getLanguagesById(
                req.user.languageId
            );
            const message = await groqService.convertMp3toText(
                req.body.toString("base64"),
                language.iso
            );

            let startTime = Date.now();

            let response = await groqService.processWithLlama(
                req.user,
                message,
                PromptType.DEFAULT
            );

            render(res, 200, statuscodes.OK, {
                message,
                references: randString,
            });
            const contextPrompt = await gptService.generateContext(
                req.user,
                message
            );

            let prompt = await promptService.createPrompt({
                sessionId: response.session?.id ?? null,
                request: message,
                response:
                    response.chatCompletion.choices[0].message.content ?? "",
                responseTime: Date.now() - startTime || 0,
                promptToken: response.chatCompletion.usage.prompt_tokens || 0,
                completionToken:
                    response.chatCompletion.usage.completion_tokens || 0,
                totalTokens: response.chatCompletion.usage.total_tokens || 0,
                type: PromptType.DEFAULT,
                isCorrect: null,
                userId: req.user.id,
                funFactsScore: null,
                learnMoreScore: null,
                metadataToken: randString,
                fullRequest: JSON.stringify({
                    request: req.fullRequest,
                    language: req.user.Language,
                    voice: req.user.voiceCode || "",
                }),
                Context: {
                    create: {
                        context: contextPrompt.context,
                        emoji: contextPrompt.text.emoji,
                        title: contextPrompt.text.title,
                    },
                },
            });

            await gptController.directDefaultMetada({
                ...req,
                body: {
                    unique_token: randString,
                    message: message,
                },
            });

            delete prompt.fullRequest;

            await redis.publish(
                "mattermost:userquestion",
                JSON.stringify({
                    user: req.user,
                    question: message,
                    answer: response.chatCompletion.choices[0].message.content,
                })
            );

            // console.log(response);
            await sessionRepository.sessionUpdated(response.session);
            await userLevelService.updateUserLevel(req.user);
            await userLevelService.updateQuestionAsked(req.user);

            await logService.createLog(req, {
                type: LogType.GPT,
                message: `Create process Groq using OpenAi STT (new flow) by user with id : ${req.user.id}`,
                promptId: prompt.id,
            });
        } catch (e) {
            let responseTime = new Date().getTime() - start;
            console.log(e);

            await logService.createErrorLog(req, {
                message: e.message,
                description: `STT Process using openAi \n ${e.stack}`,
                type: "GPT",
                responseTime: parseInt(responseTime.toFixed(2)),
            });

            await redis.publish(
                "mattermost:usererror",
                JSON.stringify({
                    user: req.user,
                    error: e.message,
                })
            );

            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

    directDefaultMetada: async (req) => {
        let start = new Date().getTime();
        try {
            let startTime = Date.now();

            let response = await metadataGptService.processMetadata(
                req.user,
                req.body.message
            );

            let parsedMetadata = JSON.parse(response.text);

            let prompt = await promptService.createPrompt({
                sessionId: null,
                request: req.body.message,
                response: response.text || "",
                responseTime: Date.now() - startTime || 0,
                promptToken: response.prompt_tokens || 0,
                completionToken: response.completion_tokens || 0,
                totalTokens: response.total_tokens || 0,
                type: PromptType.DEFAULT_METADATA,
                isCorrect: parsedMetadata.isCorrect,
                userId: req.user.id,
                funFactsScore: parsedMetadata.funFacts || null,
                learnMoreScore: parsedMetadata.interesting || null,
                metadataToken: req.body.unique_token,
                fullRequest: JSON.stringify({
                    request: response.fullRequest,
                    language: req.user.Language,
                    voice: req.user.voiceCode || "",
                }),
            });

            await userLevelService.updateQuestionAsked(req.user);
            await logService.createLog(req, {
                type: LogType.GPT_METADATA,
                message: `Create process GPT metadata by user with id : ${req.user.id}`,
                promptId: prompt.id,
            });

            return prompt;
        } catch (e) {
            let responseTime = new Date().getTime() - start;
            console.error(e?.response);
            await logService.createErrorLog(req, {
                message: e.message,
                description: `GPT Process Metadata \n ${e.stack}`,
                type: "GPT",
                responseTime: parseInt(responseTime.toFixed(2)),
            });

            await redis.publish(
                "mattermost:usererror",
                JSON.stringify({
                    user: req.user,
                    error: e.message,
                })
            );
        }
    },

    explainMore: async (req, res) => {
        let start = new Date().getTime();
        try {
            if (
                req.user.account.subscriptionStatus !== "active" &&
                req.user.account.subscriptionStatus !== "trialing"
            ) {
                render(res, 400, statuscodes.SUBSCRIPTION_NOT_ACTIVE, {
                    text: "Subscription not active",
                });
                return;
            } else if (
                !(await usageService.accountHasEnoughTokens(req.user.account))
            ) {
                render(res, 400, statuscodes.NOT_ENOUGH_TOKENS, {
                    text: "Looks like you run out of tokens this month",
                });
                return;
            }

            let currentPrompt = await promptRepository.findPromptById(
                parseInt(req.params.promptId)
            );
            if (!currentPrompt) {
                render(res, 400, statuscodes.NOT_FOUND, "Prompt not found");
                return;
            } else if (currentPrompt.session.userId !== req.user.id) {
                render(
                    res,
                    400,
                    statuscodes.UNAUTHORIZED_ACCESS,
                    "Unauthorized"
                );
                return;
            } else if (currentPrompt.type !== PromptType.DEFAULT) {
                render(
                    res,
                    400,
                    statuscodes.UNAUTHORIZED_ACCESS,
                    "Only default type prompts can be explained more"
                );
                return;
            }

            let existPrompt =
                await promptRepository.findPromptByParentIdAndType(
                    parseInt(currentPrompt.id),
                    PromptType.EXPLAIN_MORE
                );
            if (existPrompt) {
                render(res, 200, statuscodes.PROMPT_EXISTS, existPrompt);
                return;
            }

            let startTime = Date.now();
            let response = await gptService.process(
                req.user,
                currentPrompt.response,
                PromptType.EXPLAIN_MORE
            );

            let prompt = await promptService.createPrompt({
                sessionId: response.session.id,
                request: currentPrompt.response,
                response: response.text || "",
                responseTime: Date.now() - startTime || 0,
                promptToken: response.prompt_tokens || 0,
                completionToken: response.completion_tokens || 0,
                totalTokens: response.total_tokens || 0,
                type: PromptType.EXPLAIN_MORE,
                userId: req.user.id,
                promptParentId: currentPrompt.id,
                fullRequest: JSON.stringify({
                    request: response.fullRequest,
                    language: req.user.Language,
                    voice: req.user.voiceCode || "",
                }),
            });

            await sessionRepository.sessionUpdated(response.session);

            await logService.createLog(req, {
                type: LogType.GPT_EXPLAIN_MORE,
                message: `Post explain more on prompt with id : ${currentPrompt.id}`,
                promptId: currentPrompt.id,
            });

            render(res, 200, statuscodes.OK, prompt);
        } catch (e) {
            let responseTime = new Date().getTime() - start;
            console.error(e?.response);
            logService.createErrorLog(req, {
                message: e.message,
                description: `GPT Explainmore \n ${e.stack}`,
                type: "GPT",
                responseTime: parseInt(responseTime.toFixed(2)),
            });

            await redis.publish(
                "mattermost:usererror",
                JSON.stringify({
                    user: req.user,
                    error: e.message,
                })
            );

            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

    funFacts: async (req, res) => {
        let start = new Date().getTime();
        try {
            if (
                req.user.account.subscriptionStatus !== "active" &&
                req.user.account.subscriptionStatus !== "trialing"
            ) {
                render(res, 400, statuscodes.SUBSCRIPTION_NOT_ACTIVE, {
                    text: "Subscription not active",
                });
                return;
            } else if (
                !(await usageService.accountHasEnoughTokens(req.user.account))
            ) {
                render(res, 400, statuscodes.NOT_ENOUGH_TOKENS, {
                    text: "Looks like you run out of tokens this month",
                });
                return;
            }
            // console.log(req.user.id)
            let currentPrompt = await promptRepository.findPromptById(
                parseInt(req.params.promptId)
            );
            if (!currentPrompt) {
                render(res, 400, statuscodes.NOT_FOUND, "Prompt not found");
                return;
            } else if (currentPrompt.session.userId !== req.user.id) {
                render(
                    res,
                    400,
                    statuscodes.UNAUTHORIZED_ACCESS,
                    "Unauthorized"
                );
                return;
            } else if (currentPrompt.type !== PromptType.DEFAULT) {
                render(
                    res,
                    400,
                    statuscodes.UNAUTHORIZED_ACCESS,
                    "Only default type prompts can use fun fact"
                );
                return;
            }

            let existPrompt =
                await promptRepository.findPromptByParentIdAndType(
                    parseInt(currentPrompt.id),
                    PromptType.FUN_FACTS
                );
            if (existPrompt) {
                render(res, 200, statuscodes.PROMPT_EXISTS, existPrompt);
                return;
            }

            let startTime = Date.now();
            let response = await gptService.process(
                req.user,
                currentPrompt.response,
                PromptType.FUN_FACTS
            );
            // console.log(response.text)
            const funFacts = JSON.parse(response.text);
            // console.log(funFacts)
            if (!stringHelper.containsOnlyArrayOfStrings(funFacts)) {
                render(
                    res,
                    400,
                    statuscodes.GPT_FAILED,
                    "GPT generating fun facts."
                );
                return;
            }
            // console.log(funFacts)
            let prompt = await promptService.createPrompt({
                sessionId: response.session.id,
                request: currentPrompt.response,
                response: response.text || "",
                responseTime: Date.now() - startTime || 0,
                promptToken: response.prompt_tokens || 0,
                completionToken: response.completion_tokens || 0,
                totalTokens: response.total_tokens || 0,
                type: PromptType.FUN_FACTS,
                userId: req.user.id,
                promptParentId: currentPrompt.id,
                funFacts: {
                    create: funFacts.map((text) => ({ fact: text })),
                },
                fullRequest: JSON.stringify({
                    request: response.fullRequest,
                    language: req.user.Language,
                    voice: req.user.voiceCode || "",
                }),
            });

            await sessionRepository.sessionUpdated(response.session);

            await logService.createLog(req, {
                type: LogType.GPT_FUN_FACT,
                promptId: currentPrompt.id,
                message: `Get Funfact on Prompt with id : ${currentPrompt.id}`,
            });

            render(res, 200, statuscodes.OK, { funFacts, ...prompt });
        } catch (e) {
            let responseTime = new Date().getTime() - start;
            console.error(e?.response);
            logService.createErrorLog(req, {
                message: e.message,
                description: `GPT Funfacts \n ${e.stack}`,
                type: "GPT",
                responseTime: parseInt(responseTime.toFixed(2)),
            });

            await redis.publish(
                "mattermost:usererror",
                JSON.stringify({
                    user: req.user,
                    error: e.message,
                })
            );

            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

    facts: async (req, res) => {
        let start = new Date().getTime();
        try {
            if (
                req.user.account.subscriptionStatus !== "active" &&
                req.user.account.subscriptionStatus !== "trialing"
            ) {
                render(res, 400, statuscodes.SUBSCRIPTION_NOT_ACTIVE, {
                    text: "Subscription not active",
                });
                return;
            } else if (
                !(await usageService.accountHasEnoughTokens(req.user.account))
            ) {
                render(res, 400, statuscodes.NOT_ENOUGH_TOKENS, {
                    text: "Looks like you run out of tokens this month",
                });
                return;
            }

            let topic = await topicRepository.findOneById(
                parseInt(req.params.topicId)
            );
            if (!topic) {
                render(res, 400, statuscodes.NOT_FOUND, "Topic not found");
                return;
            }

            let startTime = Date.now();
            let response = await gptService.processFactsUsingChatGPT(
                req.user,
                topic
            );

            let prompt = await promptService.createPrompt({
                sessionId: null,
                request: "Facts about " + topic.name,
                response: response.text || "",
                responseTime: Date.now() - startTime || 0,
                promptToken: response.prompt_tokens || 0,
                completionToken: response.completion_tokens || 0,
                totalTokens: response.total_tokens || 0,
                type: PromptType.FACT,
                userId: req.user.id,
                topicId: topic.id,
                fullRequest: JSON.stringify({
                    request: response.fullRequest,
                    language: req.user.Language,
                    voice: req.user.voiceCode || "",
                }),
            });

            await redis.publish(
                "mattermost:usertrivia",
                JSON.stringify({
                    userEmail: req.user.email,
                    topic: topic.name,
                })
            );

            await logService.createLog(req, {
                type: LogType.GPT_FACT,
                message: `Get Fact on Topic`,
                promptId: prompt.id,
            });

            render(res, 200, statuscodes.OK, {
                result: response.result,
                ...prompt,
            });
        } catch (e) {
            let responseTime = new Date().getTime() - start;
            console.error(e?.response);
            logService.createErrorLog(req, {
                message: e.message,
                description: `GPT Facts \n ${e.stack}`,
                type: "GPT",
                responseTime: parseInt(responseTime.toFixed(2)),
            });

            await redis.publish(
                "mattermost:usererror",
                JSON.stringify({
                    user: req.user,
                    error: e.message,
                })
            );

            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

    factsUsingLlma: async (req, res) => {
        let start = new Date().getTime();
        try {
            if (
                req.user.account.subscriptionStatus !== "active" &&
                req.user.account.subscriptionStatus !== "trialing"
            ) {
                render(res, 400, statuscodes.SUBSCRIPTION_NOT_ACTIVE, {
                    text: "Subscription not active",
                });
                return;
            } else if (
                !(await usageService.accountHasEnoughTokens(req.user.account))
            ) {
                render(res, 400, statuscodes.NOT_ENOUGH_TOKENS, {
                    text: "Looks like you run out of tokens this month",
                });
                return;
            }

            let topic = await topicRepository.findOneById(
                parseInt(req.params.topicId)
            );
            if (!topic) {
                render(res, 400, statuscodes.NOT_FOUND, "Topic not found");
                return;
            }

            let startTime = Date.now();
            let response = await groqService.processFactsUsingLlama(
                req.user,
                topic
            );

            let prompt = await promptService.createPrompt({
                sessionId: null,
                request: "Facts about " + topic.name,
                response: response.text || "",
                responseTime: Date.now() - startTime || 0,
                promptToken: response.chatCompletion.usage.prompt_tokens || 0,
                completionToken:
                    response.chatCompletion.usage.completion_tokens || 0,
                totalTokens: response.chatCompletion.usage.total_tokens || 0,
                type: PromptType.FACT,
                userId: req.user.id,
                topicId: topic.id,
                fullRequest: JSON.stringify({
                    request: response.fullRequest,
                    language: req.user.Language,
                    voice: req.user.voiceCode || "",
                }),
            });

            await redis.publish(
                "mattermost:usertrivia",
                JSON.stringify({
                    userEmail: req.user.email,
                    topic: topic.name,
                })
            );

            await logService.createLog(req, {
                type: LogType.GPT_FACT,
                message: `Get Fact on Topic`,
                promptId: prompt.id,
            });

            render(res, 200, statuscodes.OK, {
                result: response.result,
                ...prompt,
            });
        } catch (e) {
            let responseTime = new Date().getTime() - start;
            console.error(e?.response);
            logService.createErrorLog(req, {
                message: e.message,
                description: `GPT Facts \n ${e.stack}`,
                type: "GPT",
                responseTime: parseInt(responseTime.toFixed(2)),
            });

            await redis.publish(
                "mattermost:usererror",
                JSON.stringify({
                    user: req.user,
                    error: e.message,
                })
            );

            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

    factsUsingPrompt: async (req, res) => {
        let start = new Date().getTime();
        try {
            if (
                req.user.account.subscriptionStatus !== "active" &&
                req.user.account.subscriptionStatus !== "trialing"
            ) {
                render(res, 400, statuscodes.SUBSCRIPTION_NOT_ACTIVE, {
                    text: "Subscription not active",
                });
                return;
            } else if (
                !(await usageService.accountHasEnoughTokens(req.user.account))
            ) {
                render(res, 400, statuscodes.NOT_ENOUGH_TOKENS, {
                    text: "Looks like you run out of tokens this month",
                });
                return;
            }

            let getPrompt = await promptRepository.getPromptsById(
                parseInt(req.params.promptId)
            );
            if (!getPrompt) {
                render(res, 400, statuscodes.NOT_FOUND, "Prompt not found");
                return;
            }

            let startTime = Date.now();
            let response = await gptService.processFactsUsingChatGPTAndPrompt(
                req.user,
                getPrompt
            );
            let prompt = await promptService.createPrompt({
                sessionId: null,
                request: "Facts about " + getPrompt.request,
                response: response.text || "",
                responseTime: Date.now() - startTime || 0,
                promptToken: response.prompt_tokens || 0,
                completionToken: response.completion_tokens || 0,
                totalTokens: response.total_tokens || 0,
                type: PromptType.FACT,
                userId: req.user.id,
                fullRequest: JSON.stringify({
                    request: response.fullRequest,
                    language: req.user.Language,
                    voice: req.user.voiceCode || "",
                }),
            });

            await redis.publish(
                "mattermost:usertrivia",
                JSON.stringify({
                    userEmail: req.user.email,
                    topic: getPrompt.request,
                })
            );

            await logService.createLog(req, {
                type: LogType.GPT_FACT,
                message: `Get Fact on Topic`,
                promptId: prompt.id,
            });

            render(res, 200, statuscodes.OK, {
                result: response.result,
                ...prompt,
            });
        } catch (e) {
            let responseTime = new Date().getTime() - start;
            console.error(e?.response);
            logService.createErrorLog(req, {
                message: e.message,
                description: `GPT Facts \n ${e.stack}`,
                type: "GPT",
                responseTime: parseInt(responseTime.toFixed(2)),
            });

            await redis.publish(
                "mattermost:usererror",
                JSON.stringify({
                    user: req.user,
                    error: e.message,
                })
            );

            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

    factsUsingEmoji: async (req, res) => {
        let start = new Date().getTime();
        try {
            if (
                req.user.account.subscriptionStatus !== "active" &&
                req.user.account.subscriptionStatus !== "trialing"
            ) {
                render(res, 400, statuscodes.SUBSCRIPTION_NOT_ACTIVE, {
                    text: "Subscription not active",
                });
                return;
            } else if (
                !(await usageService.accountHasEnoughTokens(req.user.account))
            ) {
                render(res, 400, statuscodes.NOT_ENOUGH_TOKENS, {
                    text: "Looks like you run out of tokens this month",
                });
                return;
            }


            let startTime = Date.now();
            let response = await gptService.processFactsUsingChatGPTAndPrompt(
                req.user,
                {
                    request : req.body.text
                }
            );
            let prompt = await promptService.createPrompt({
                sessionId: null,
                request: "Facts about " + req.body.text,
                response: response.text || "",
                responseTime: Date.now() - startTime || 0,
                promptToken: response.prompt_tokens || 0,
                completionToken: response.completion_tokens || 0,
                totalTokens: response.total_tokens || 0,
                type: PromptType.FACT,
                userId: req.user.id,
                fullRequest: JSON.stringify({
                    request: response.fullRequest,
                    language: req.user.Language,
                    voice: req.user.voiceCode || "",
                }),
            });

            await redis.publish(
                "mattermost:usertrivia",
                JSON.stringify({
                    userEmail: req.user.email,
                    topic: req.body.text,
                })
            );

            await logService.createLog(req, {
                type: LogType.GPT_FACT,
                message: `Get Fact on Topic`,
                promptId: prompt.id,
            });

            render(res, 200, statuscodes.OK, {
                result: response.result,
                ...prompt,
            });
        } catch (e) {
            let responseTime = new Date().getTime() - start;
            console.error(e?.response);
            logService.createErrorLog(req, {
                message: e.message,
                description: `GPT Facts \n ${e.stack}`,
                type: "GPT",
                responseTime: parseInt(responseTime.toFixed(2)),
            });

            await redis.publish(
                "mattermost:usererror",
                JSON.stringify({
                    user: req.user,
                    error: e.message,
                })
            );

            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

    factsUsingLlama3AndPrompt: async (req, res) => {
        let start = new Date().getTime();
        try {
            if (
                req.user.account.subscriptionStatus !== "active" &&
                req.user.account.subscriptionStatus !== "trialing"
            ) {
                render(res, 400, statuscodes.SUBSCRIPTION_NOT_ACTIVE, {
                    text: "Subscription not active",
                });
                return;
            } else if (
                !(await usageService.accountHasEnoughTokens(req.user.account))
            ) {
                render(res, 400, statuscodes.NOT_ENOUGH_TOKENS, {
                    text: "Looks like you run out of tokens this month",
                });
                return;
            }

            let getPrompt = await promptRepository.getPromptsById(
                parseInt(req.params.promptId)
            );
            if (!getPrompt) {
                render(res, 400, statuscodes.NOT_FOUND, "Prompt not found");
                return;
            }

            let startTime = Date.now();
            let response = await groqService.processFactsUsingLlamaAndPrompt(
                req.user,
                getPrompt
            );
            let prompt = await promptService.createPrompt({
                sessionId: null,
                request: "Facts about " + getPrompt.request,
                response: response.text || "",
                responseTime: Date.now() - startTime || 0,
                promptToken: response.chatCompletion.usage.prompt_tokens || 0,
                completionToken:
                    response.chatCompletion.usage.completion_tokens || 0,
                totalTokens: response.chatCompletion.usage.total_tokens || 0,
                type: PromptType.FACT,
                userId: req.user.id,
                fullRequest: JSON.stringify({
                    request: response.fullRequest,
                    language: req.user.Language,
                    voice: req.user.voiceCode || "",
                }),
            });

            await redis.publish(
                "mattermost:usertrivia",
                JSON.stringify({
                    userEmail: req.user.email,
                    topic: getPrompt.request,
                })
            );

            await logService.createLog(req, {
                type: LogType.GPT_FACT,
                message: `Get Fact on Topic`,
                promptId: prompt.id,
            });

            render(res, 200, statuscodes.OK, {
                result: response.result,
                ...prompt,
            });
        } catch (e) {
            let responseTime = new Date().getTime() - start;
            console.error(e?.response);
            logService.createErrorLog(req, {
                message: e.message,
                description: `GPT Facts \n ${e.stack}`,
                type: "GPT",
                responseTime: parseInt(responseTime.toFixed(2)),
            });

            await redis.publish(
                "mattermost:usererror",
                JSON.stringify({
                    user: req.user,
                    error: e.message,
                })
            );

            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

    story: async (req, res) => {
        let start = new Date().getTime();
        try {
            if (
                req.user.account.subscriptionStatus !== "active" &&
                req.user.account.subscriptionStatus !== "trialing"
            ) {
                render(res, 400, statuscodes.SUBSCRIPTION_NOT_ACTIVE, {
                    text: "Subscription not active",
                });
                return;
            } else if (
                !(await usageService.accountHasEnoughTokens(req.user.account))
            ) {
                render(res, 400, statuscodes.NOT_ENOUGH_TOKENS, {
                    text: "Looks like you run out of tokens this month",
                });
                return;
            }

            const schema = Joi.object({
                topics: Joi.array()
                    .items(Joi.number().integer().required())
                    .min(1),
                prompts: Joi.array()
                    .items(Joi.number().integer().required())
                    .min(1),
            }).or("topics", "prompts");

            const { error, value } = schema.validate(req.body);

            if (error) {
                render(
                    res,
                    400,
                    statuscodes.BAD_REQUEST,
                    "Invalid request, at least one topic or one prompt"
                );
                return;
            }
            let topics = await topicRepository.topicsByIds(value.topics);
            let prompts = await promptRepository.promptsById(value.prompts);

            if (
                value.topics &&
                (!topics || topics.length !== value.topics.length)
            ) {
                render(res, 400, statuscodes.NOT_FOUND, "Topic/s not found");
                return;
            }
            if (
                value.prompts &&
                (!prompts || prompts.length !== value.prompts.length)
            ) {
                render(res, 400, statuscodes.NOT_FOUND, "Prompt/s not found");
                return;
            }

            let startTime = Date.now();
            let response = await gptService.processStory(req.user, [
                ...(value.topics ? topics.map((t) => t.name) : []),
                ...(value.prompts ? prompts.map((t) => t.request) : []),
            ]);

            let prompt = await promptService.createPrompt({
                sessionId: null,
                request: "Story",
                response: response.text || "",
                responseTime: Date.now() - startTime || 0,
                promptToken: response.prompt_tokens || 0,
                completionToken: response.completion_tokens || 0,
                totalTokens: response.total_tokens || 0,
                type: PromptType.STORY,
                userId: req.user.id,
                defaultPromptId: response.initialPrompt.id || null,
                StoryTopics: value.topics
                    ? {
                          create: value.topics.map((id) => {
                              return {
                                  topicId: id,
                              };
                          }),
                      }
                    : undefined,
                PromptStoryTopics: value.prompts
                    ? {
                          create: value.prompts.map((id) => {
                              return {
                                  topicPromptId: id,
                              };
                          }),
                      }
                    : undefined,
                fullRequest: JSON.stringify({
                    request: response.fullRequest,
                    language: req.user.Language,
                    voice: req.user.voiceCode || "",
                }),
            });

            await redis.publish(
                "mattermost:userstories",
                JSON.stringify({
                    userEmail: req.user.email,
                    topic: topics.length
                        ? topics.map((e) => e.name).join(",")
                        : "",
                })
            );

            render(res, 200, statuscodes.OK, prompt);
        } catch (e) {
            let responseTime = new Date().getTime() - start;
            console.error(e?.response);
            logService.createErrorLog(req, {
                message: e.message,
                description: `GPT Story \n ${e.stack}`,
                type: "GPT",
                responseTime: parseInt(responseTime.toFixed(2)),
            });

            await redis.publish(
                "mattermost:usererror",
                JSON.stringify({
                    user: req.user,
                    error: e.message,
                })
            );

            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

    storyUsingLlama3: async (req, res) => {
        let start = new Date().getTime();
        try {
            if (
                req.user.account.subscriptionStatus !== "active" &&
                req.user.account.subscriptionStatus !== "trialing"
            ) {
                render(res, 400, statuscodes.SUBSCRIPTION_NOT_ACTIVE, {
                    text: "Subscription not active",
                });
                return;
            } else if (
                !(await usageService.accountHasEnoughTokens(req.user.account))
            ) {
                render(res, 400, statuscodes.NOT_ENOUGH_TOKENS, {
                    text: "Looks like you run out of tokens this month",
                });
                return;
            }

            const schema = Joi.object({
                topics: Joi.array()
                    .items(Joi.number().integer().required())
                    .min(1),
                prompts: Joi.array()
                    .items(Joi.number().integer().required())
                    .min(1),
            }).or("topics", "prompts");

            const { error, value } = schema.validate(req.body);

            if (error) {
                render(
                    res,
                    400,
                    statuscodes.BAD_REQUEST,
                    "Invalid request, at least one topic or one prompt"
                );
                return;
            }
            let topics = await topicRepository.topicsByIds(value.topics);
            let prompts = await promptRepository.promptsById(value.prompts);

            if (
                value.topics &&
                (!topics || topics.length !== value.topics.length)
            ) {
                render(res, 400, statuscodes.NOT_FOUND, "Topic/s not found");
                return;
            }
            if (
                value.prompts &&
                (!prompts || prompts.length !== value.prompts.length)
            ) {
                render(res, 400, statuscodes.NOT_FOUND, "Prompt/s not found");
                return;
            }

            let startTime = Date.now();
            let response = await groqService.processStory(req.user, [
                ...(value.topics ? topics.map((t) => t.name) : []),
                ...(value.prompts ? prompts.map((t) => t.request) : []),
            ]);

            let prompt = await promptService.createPrompt({
                sessionId: null,
                request: "Story",
                response: response.text || "",
                responseTime: Date.now() - startTime || 0,
                promptToken: response.chatCompletion.usage.prompt_tokens || 0,
                completionToken:
                    response.chatCompletion.usage.completion_tokens || 0,
                totalTokens: response.chatCompletion.usage.total_tokens || 0,
                type: PromptType.STORY,
                userId: req.user.id,
                StoryTopics: value.topics
                    ? {
                          create: value.topics.map((id) => {
                              return {
                                  topicId: id,
                              };
                          }),
                      }
                    : undefined,
                PromptStoryTopics: value.prompts
                    ? {
                          create: value.prompts.map((id) => {
                              return {
                                  topicPromptId: id,
                              };
                          }),
                      }
                    : undefined,
                fullRequest: JSON.stringify({
                    request: response.fullRequest,
                    language: req.user.Language,
                    voice: req.user.voiceCode || "",
                }),
            });

            await redis.publish(
                "mattermost:userstories",
                JSON.stringify({
                    userEmail: req.user.email,
                    topic: topics.length
                        ? topics.map((e) => e.name).join(",")
                        : "",
                })
            );

            render(res, 200, statuscodes.OK, prompt);
        } catch (e) {
            let responseTime = new Date().getTime() - start;
            console.error(e?.response);
            logService.createErrorLog(req, {
                message: e.message,
                description: `GPT Story \n ${e.stack}`,
                type: "GPT",
                responseTime: parseInt(responseTime.toFixed(2)),
            });

            await redis.publish(
                "mattermost:usererror",
                JSON.stringify({
                    user: req.user,
                    error: e.message,
                })
            );

            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

    createQuiz: async (req, res) => {
        let start = new Date().getTime();
        try {
            if (
                req.user.account.subscriptionStatus !== "active" &&
                req.user.account.subscriptionStatus !== "trialing"
            ) {
                render(res, 400, statuscodes.SUBSCRIPTION_NOT_ACTIVE, {
                    text: "Subscription not active",
                });
                return;
            } else if (
                !(await usageService.accountHasEnoughTokens(req.user.account))
            ) {
                render(res, 400, statuscodes.NOT_ENOUGH_TOKENS, {
                    text: "Looks like you run out of tokens this month",
                });
                return;
            }

            let topic = await topicRepository.findOneById(
                parseInt(req.params.topicId)
            );
            if (!topic) {
                render(res, 400, statuscodes.NOT_FOUND, "Topic not found");
                return;
            }

            let startTime = Date.now();
            let response = await gptService.createQuizUsingChatGPT(
                req.user,
                topic
            );

            const quiz = JSON.parse(response.text);
            // console.log(quiz)
            let prompt = await promptService.createPrompt({
                sessionId: null,
                request: "Quiz",
                response: response.text || "",
                responseTime: Date.now() - startTime || 0,
                promptToken: response.prompt_tokens || 0,
                completionToken: response.completion_tokens || 0,
                totalTokens: response.total_tokens || 0,
                type: PromptType.QUIZ,
                userId: req.user.id,
                Quiz: {
                    create: {
                        topicId: topic.id,
                        userId: req.user.id,
                        QuizEntry: {
                            create: quiz.map((q) => {
                                return {
                                    question: q.question,
                                    correctAnswer: q.answer,
                                };
                            }),
                        },
                    },
                },
                fullRequest: JSON.stringify({
                    request: response.fullRequest,
                    language: req.user.Language,
                    voice: req.user.voiceCode || "",
                }),
            });

            await redis.publish(
                "mattermost:userquiz",
                JSON.stringify({
                    userEmail: req.user.email,
                    topic: topic.name,
                })
            );

            render(res, 200, statuscodes.OK, prompt);
        } catch (e) {
            console.log(e);
            let responseTime = new Date().getTime() - start;
            console.error(e?.response);
            logService.createErrorLog(req, {
                message: e.message,
                description: `GPT Create Quiz \n ${e.stack}`,
                type: "GPT",
                responseTime: parseInt(responseTime.toFixed(2)),
            });

            await redis.publish(
                "mattermost:usererror",
                JSON.stringify({
                    user: req.user,
                    error: e.message,
                })
            );

            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

    createQuizUsingPrompt: async (req, res) => {
        let start = new Date().getTime();
        try {
            if (
                req.user.account.subscriptionStatus !== "active" &&
                req.user.account.subscriptionStatus !== "trialing"
            ) {
                render(res, 400, statuscodes.SUBSCRIPTION_NOT_ACTIVE, {
                    text: "Subscription not active",
                });
                return;
            } else if (
                !(await usageService.accountHasEnoughTokens(req.user.account))
            ) {
                render(res, 400, statuscodes.NOT_ENOUGH_TOKENS, {
                    text: "Looks like you run out of tokens this month",
                });
                return;
            }

            let getPrompt = await promptRepository.getPromptsById(
                parseInt(req.params.promptId)
            );
            if (!getPrompt) {
                render(res, 400, statuscodes.NOT_FOUND, "Prompt not found");
                return;
            }

            let startTime = Date.now();
            let response = await gptService.createQuizUsingChatGPTAndPrompt(
                req.user,
                getPrompt
            );

            const quiz = JSON.parse(response.text);
            // console.log(quiz)
            let prompt = await promptService.createPrompt({
                sessionId: null,
                request: "Quiz",
                response: response.text || "",
                responseTime: Date.now() - startTime || 0,
                promptToken: response.prompt_tokens || 0,
                completionToken: response.completion_tokens || 0,
                totalTokens: response.total_tokens || 0,
                type: PromptType.QUIZ,
                userId: req.user.id,
                Quiz: {
                    create: {
                        promptFromId: getPrompt.id,
                        userId: req.user.id,
                        QuizEntry: {
                            create: quiz.map((q) => {
                                return {
                                    question: q.question,
                                    correctAnswer: q.answer,
                                };
                            }),
                        },
                    },
                },
                fullRequest: JSON.stringify({
                    request: response.fullRequest,
                    language: req.user.Language,
                    voice: req.user.voiceCode || "",
                }),
            });

            await redis.publish(
                "mattermost:userquiz",
                JSON.stringify({
                    userEmail: req.user.email,
                    topic: getPrompt.request,
                })
            );

            render(res, 200, statuscodes.OK, prompt);
        } catch (e) {
            console.log(e);
            let responseTime = new Date().getTime() - start;
            console.error(e?.response);
            logService.createErrorLog(req, {
                message: e.message,
                description: `GPT Create Quiz \n ${e.stack}`,
                type: "GPT",
                responseTime: parseInt(responseTime.toFixed(2)),
            });

            await redis.publish(
                "mattermost:usererror",
                JSON.stringify({
                    user: req.user,
                    error: e.message,
                })
            );

            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

    createQuizUsingEmoji: async (req, res) => {
        let start = new Date().getTime();
        try {
            if (
                req.user.account.subscriptionStatus !== "active" &&
                req.user.account.subscriptionStatus !== "trialing"
            ) {
                render(res, 400, statuscodes.SUBSCRIPTION_NOT_ACTIVE, {
                    text: "Subscription not active",
                });
                return;
            } else if (
                !(await usageService.accountHasEnoughTokens(req.user.account))
            ) {
                render(res, 400, statuscodes.NOT_ENOUGH_TOKENS, {
                    text: "Looks like you run out of tokens this month",
                });
                return;
            }

            let startTime = Date.now();
            let response = await gptService.createQuizUsingChatGPTAndPrompt(
                req.user,
                {
                    request : req.body.text
                }
            );

            const quiz = JSON.parse(response.text);
            // console.log(quiz)
            let prompt = await promptService.createPrompt({
                sessionId: null,
                request: "Quiz",
                response: response.text || "",
                responseTime: Date.now() - startTime || 0,
                promptToken: response.prompt_tokens || 0,
                completionToken: response.completion_tokens || 0,
                totalTokens: response.total_tokens || 0,
                type: PromptType.QUIZ,
                userId: req.user.id,
                Quiz: {
                    create: {
                        emoji : req.body.text,
                        userId: req.user.id,
                        QuizEntry: {
                            create: quiz.map((q) => {
                                return {
                                    question: q.question,
                                    correctAnswer: q.answer,
                                };
                            }),
                        },
                    },
                },
                fullRequest: JSON.stringify({
                    request: response.fullRequest,
                    language: req.user.Language,
                    voice: req.user.voiceCode || "",
                }),
            });

            await redis.publish(
                "mattermost:userquiz",
                JSON.stringify({
                    userEmail: req.user.email,
                    topic: req.body.text,
                })
            );

            render(res, 200, statuscodes.OK, prompt);
        } catch (e) {
            console.log(e);
            let responseTime = new Date().getTime() - start;
            console.error(e?.response);
            logService.createErrorLog(req, {
                message: e.message,
                description: `GPT Create Quiz \n ${e.stack}`,
                type: "GPT",
                responseTime: parseInt(responseTime.toFixed(2)),
            });

            await redis.publish(
                "mattermost:usererror",
                JSON.stringify({
                    user: req.user,
                    error: e.message,
                })
            );

            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

    createQuizUsingLlama: async (req, res) => {
        let start = new Date().getTime();
        try {
            if (
                req.user.account.subscriptionStatus !== "active" &&
                req.user.account.subscriptionStatus !== "trialing"
            ) {
                render(res, 400, statuscodes.SUBSCRIPTION_NOT_ACTIVE, {
                    text: "Subscription not active",
                });
                return;
            } else if (
                !(await usageService.accountHasEnoughTokens(req.user.account))
            ) {
                render(res, 400, statuscodes.NOT_ENOUGH_TOKENS, {
                    text: "Looks like you run out of tokens this month",
                });
                return;
            }

            let topic = await topicRepository.findOneById(
                parseInt(req.params.topicId)
            );
            if (!topic) {
                render(res, 400, statuscodes.NOT_FOUND, "Topic not found");
                return;
            }

            let startTime = Date.now();
            let response = await groqService.createQuizWithLlama(
                req.user,
                topic
            );

            const quiz = JSON.parse(
                response.chatCompletion.choices[0].message.content
            );
            // console.log(quiz)
            let prompt = await promptService.createPrompt({
                sessionId: response.session?.id ?? null,
                request: "Quiz",
                response:
                    response.chatCompletion.choices[0].message.content ?? "",
                responseTime: Date.now() - startTime || 0,
                promptToken: response.chatCompletion.usage.prompt_tokens || 0,
                completionToken:
                    response.chatCompletion.usage.completion_tokens || 0,
                totalTokens: response.chatCompletion.usage.total_tokens || 0,
                type: PromptType.QUIZ,
                isCorrect: null,
                userId: req.user.id,
                funFactsScore: null,
                learnMoreScore: null,
                Quiz: {
                    create: {
                        topicId: topic.id,
                        userId: req.user.id,
                        QuizEntry: {
                            create: quiz.map((q) => {
                                return {
                                    question: q.question,
                                    correctAnswer: q.answer,
                                };
                            }),
                        },
                    },
                },
                fullRequest: JSON.stringify({
                    request: response.fullRequest,
                    language: req.user.Language || "",
                    voice: req.user.voiceCode || "",
                }),
            });

            await redis.publish(
                "mattermost:userquiz",
                JSON.stringify({
                    userEmail: req.user.email,
                    topic: topic.name,
                })
            );

            render(res, 200, statuscodes.OK, prompt);
        } catch (e) {
            console.log(e);
            let responseTime = new Date().getTime() - start;
            console.error(e?.response);
            logService.createErrorLog(req, {
                message: e.message,
                description: `Llama3 Create Quiz \n ${e.stack}`,
                type: "Groq Llama3",
                responseTime: parseInt(responseTime.toFixed(2)),
            });

            await redis.publish(
                "mattermost:usererror",
                JSON.stringify({
                    user: req.user,
                    error: e.message,
                })
            );

            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

    createQuizUsingLlamaAndPrompt: async (req, res) => {
        let start = new Date().getTime();
        try {
            if (
                req.user.account.subscriptionStatus !== "active" &&
                req.user.account.subscriptionStatus !== "trialing"
            ) {
                render(res, 400, statuscodes.SUBSCRIPTION_NOT_ACTIVE, {
                    text: "Subscription not active",
                });
                return;
            } else if (
                !(await usageService.accountHasEnoughTokens(req.user.account))
            ) {
                render(res, 400, statuscodes.NOT_ENOUGH_TOKENS, {
                    text: "Looks like you run out of tokens this month",
                });
                return;
            }
            let getPrompt = await promptRepository.getPromptsById(
                parseInt(req.params.promptId)
            );
            if (!getPrompt) {
                render(res, 400, statuscodes.NOT_FOUND, "Prompt not found");
                return;
            }

            let startTime = Date.now();
            let response = await groqService.createQuizWithLlamaAndPrompt(
                req.user,
                getPrompt
            );
            const quiz = JSON.parse(
                response.chatCompletion.choices[0].message.content
            );
            // console.log(quiz)
            let prompt = await promptService.createPrompt({
                sessionId: response.session?.id ?? null,
                request: "Quiz",
                response:
                    response.chatCompletion.choices[0].message.content ?? "",
                responseTime: Date.now() - startTime || 0,
                promptToken: response.chatCompletion.usage.prompt_tokens || 0,
                completionToken:
                    response.chatCompletion.usage.completion_tokens || 0,
                totalTokens: response.chatCompletion.usage.total_tokens || 0,
                type: PromptType.QUIZ,
                isCorrect: null,
                userId: req.user.id,
                funFactsScore: null,
                learnMoreScore: null,
                Quiz: {
                    create: {
                        promptFromId: getPrompt.id,
                        userId: req.user.id,
                        QuizEntry: {
                            create: quiz.map((q) => {
                                return {
                                    question: q.question,
                                    correctAnswer: q.answer,
                                };
                            }),
                        },
                    },
                },
                fullRequest: JSON.stringify({
                    request: response.fullRequest,
                    language: req.user.Language || "",
                    voice: req.user.voiceCode || "",
                }),
            });

            await redis.publish(
                "mattermost:userquiz",
                JSON.stringify({
                    userEmail: req.user.email,
                    topic: getPrompt.request,
                })
            );

            render(res, 200, statuscodes.OK, prompt);
        } catch (e) {
            console.log(e);
            let responseTime = new Date().getTime() - start;
            console.error(e?.response);
            logService.createErrorLog(req, {
                message: e.message,
                description: `Llama3 Create Quiz \n ${e.stack}`,
                type: "Groq Llama3",
                responseTime: parseInt(responseTime.toFixed(2)),
            });

            await redis.publish(
                "mattermost:usererror",
                JSON.stringify({
                    user: req.user,
                    error: e.message,
                })
            );

            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

    quizExplainMore: async (req, res) => {
        let start = new Date().getTime();
        try {
            if (
                req.user.account.subscriptionStatus !== "active" &&
                req.user.account.subscriptionStatus !== "trialing"
            ) {
                render(res, 400, statuscodes.SUBSCRIPTION_NOT_ACTIVE, {
                    text: "Subscription not active",
                });
                return;
            } else if (
                !(await usageService.accountHasEnoughTokens(req.user.account))
            ) {
                render(res, 400, statuscodes.NOT_ENOUGH_TOKENS, {
                    text: "Looks like you run out of tokens this month",
                });
                return;
            }

            let quizEntry = await quizEntryRepository.findOneById(
                parseInt(req.params.quizEntryId)
            );
            if (!quizEntry) {
                render(res, 400, statuscodes.NOT_FOUND, "Quiz entry not found");
                return;
            }
            if (quizEntry.quiz.userId !== req.user.id) {
                render(res, 400, statuscodes.NOT_FOUND, "Quiz entry not found");
                return;
            }

            let startTime = Date.now();
            let response = await gptService.quizExplainMoreUsingChatGPT(
                req.user,
                quizEntry
            );

            let prompt = await promptService.createPrompt({
                sessionId: null,
                request: "Quiz explain more",
                response: response.text || "",
                responseTime: Date.now() - startTime || 0,
                promptToken: response.prompt_tokens || 0,
                completionToken: response.completion_tokens || 0,
                totalTokens: response.total_tokens || 0,
                type: PromptType.QUIZ_EXPLAIN_MORE,
                userId: req.user.id,
                fullRequest: JSON.stringify({
                    request: response.fullRequest,
                    language: req.user.Language,
                    voice: req.user.voiceCode || "",
                }),
                quizEntryId: parseInt(req.params.quizEntryId),
            });

            render(res, 200, statuscodes.OK, prompt);
        } catch (e) {
            let responseTime = new Date().getTime() - start;
            console.error(e?.response);
            logService.createErrorLog(req, {
                message: e.message,
                description: `GPT Create Quiz \n ${e.stack}`,
                type: "GPT",
                responseTime: parseInt(responseTime.toFixed(2)),
            });

            await redis.publish(
                "mattermost:usererror",
                JSON.stringify({
                    user: req.user,
                    error: e.message,
                })
            );

            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

    quizExplainMoreLlama3: async (req, res) => {
        let start = new Date().getTime();
        try {
            if (
                req.user.account.subscriptionStatus !== "active" &&
                req.user.account.subscriptionStatus !== "trialing"
            ) {
                render(res, 400, statuscodes.SUBSCRIPTION_NOT_ACTIVE, {
                    text: "Subscription not active",
                });
                return;
            } else if (
                !(await usageService.accountHasEnoughTokens(req.user.account))
            ) {
                render(res, 400, statuscodes.NOT_ENOUGH_TOKENS, {
                    text: "Looks like you run out of tokens this month",
                });
                return;
            }

            let quizEntry = await quizEntryRepository.findOneById(
                parseInt(req.params.quizEntryId)
            );
            if (!quizEntry) {
                render(res, 400, statuscodes.NOT_FOUND, "Quiz entry not found");
                return;
            }
            if (quizEntry.quiz.userId !== req.user.id) {
                render(res, 400, statuscodes.NOT_FOUND, "Quiz entry not found");
                return;
            }

            let startTime = Date.now();
            let response = await groqService.quizExplainMoreUsingLlama(
                req.user,
                quizEntry
            );

            let prompt = await promptService.createPrompt({
                sessionId: null,
                request: "Quiz explain more",
                response: response.text || "",
                responseTime: Date.now() - startTime || 0,
                promptToken: response.chatCompletion.usage.prompt_tokens || 0,
                completionToken:
                    response.chatCompletion.usage.completion_tokens || 0,
                totalTokens: response.chatCompletion.usage.total_tokens || 0,
                type: PromptType.QUIZ_EXPLAIN_MORE,
                userId: req.user.id,
                fullRequest: JSON.stringify({
                    request: response.fullRequest,
                    language: req.user.Language || "",
                    voice: req.user.voiceCode || "",
                }),
                quizEntryId: parseInt(req.params.quizEntryId),
            });

            render(res, 200, statuscodes.OK, prompt);
        } catch (e) {
            let responseTime = new Date().getTime() - start;
            console.error(e?.response);
            logService.createErrorLog(req, {
                message: e.message,
                description: `GPT Create Quiz \n ${e.stack}`,
                type: "GPT",
                responseTime: parseInt(responseTime.toFixed(2)),
            });

            await redis.publish(
                "mattermost:usererror",
                JSON.stringify({
                    user: req.user,
                    error: e.message,
                })
            );

            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

    idle: async (req, res) => {
        let start = new Date().getTime();
        try {
            if (
                req.user.account.subscriptionStatus !== "active" &&
                req.user.account.subscriptionStatus !== "trialing"
            ) {
                render(res, 400, statuscodes.SUBSCRIPTION_NOT_ACTIVE, {
                    text: "Subscription not active",
                });
                return;
            } else if (
                !(await usageService.accountHasEnoughTokens(req.user.account))
            ) {
                render(res, 400, statuscodes.NOT_ENOUGH_TOKENS, {
                    text: "Looks like you run out of tokens this month",
                });
                return;
            }

            let startTime = Date.now();
            let response = await gptService.processIdle(req.user);

            let prompt = await promptService.createPrompt({
                sessionId: null,
                request: "Idle",
                response: response.text || "",
                responseTime: Date.now() - startTime || 0,
                promptToken: response.prompt_tokens || 0,
                completionToken: response.completion_tokens || 0,
                totalTokens: response.total_tokens || 0,
                type: PromptType.IDLE,
                userId: req.user.id,
                defaultPromptId: response.initialPrompt.id || null,
                fullRequest: JSON.stringify({
                    request: response.fullRequest,
                    language: req.user.Language,
                    voice: req.user.voiceCode || "",
                }),
            });

            render(res, 200, statuscodes.OK, prompt);
        } catch (e) {
            let responseTime = new Date().getTime() - start;
            console.error(e?.response);
            logService.createErrorLog(req, {
                message: e.message,
                description: `GPT Story \n ${e.stack}`,
                type: "GPT",
                responseTime: parseInt(responseTime.toFixed(2)),
            });

            await redis.publish(
                "mattermost:usererror",
                JSON.stringify({
                    user: req.user,
                    error: e.message,
                })
            );

            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

    dalle: async (req, res) => {
        let start = new Date().getTime();
        try {
            if (
                req.user.account.subscriptionStatus !== "active" &&
                req.user.account.subscriptionStatus !== "trialing"
            ) {
                render(res, 400, statuscodes.SUBSCRIPTION_NOT_ACTIVE, {
                    text: "Subscription not active",
                });
                return;
            } else if (
                !(await usageService.accountHasEnoughTokens(req.user.account))
            ) {
                render(res, 400, statuscodes.NOT_ENOUGH_TOKENS, {
                    text: "Looks like you run out of tokens this month",
                });
                return;
            }

            const schema = Joi.object({
                concept: Joi.string().required(),
            });

            const { error, value } = schema.validate(req.body);
            if (error) {
                render(
                    res,
                    400,
                    statuscodes.BAD_REQUEST,
                    "Invalid request, at least one topic"
                );
                return;
            }

            let startTime = Date.now();
            let response = await dalleService.generateImage(req.user, value);

            let prompt = await promptService.createPrompt({
                sessionId: null,
                request: "Dalle",
                response: response.text || "",
                responseTime: Date.now() - startTime || 0,
                promptToken: response.prompt_tokens || 0,
                completionToken: response.completion_tokens || 0,
                totalTokens: response.total_tokens || 0,
                type: PromptType.DALLE,
                userId: req.user.id,
                image: response.image,
                defaultPromptId: response.initialPrompt.id || null,
                fullRequest: JSON.stringify({
                    request: response.fullRequest,
                    language: req.user.Language,
                    voice: req.user.voiceCode || "",
                }),
            });

            await redis.publish(
                "mattermost:dalle",
                JSON.stringify({
                    userEmail: req.user.email,
                    concept: value.concept,
                    image: response.image,
                })
            );

            render(res, 200, statuscodes.OK, prompt);
        } catch (e) {
            let responseTime = new Date().getTime() - start;
            console.error(e?.response);
            logService.createErrorLog(req, {
                message: e.message,
                description: `GPT Story \n ${e.stack}`,
                type: "GPT",
                responseTime: parseInt(responseTime.toFixed(2)),
            });

            await redis.publish(
                "mattermost:usererror",
                JSON.stringify({
                    user: req.user,
                    error: e.message,
                })
            );

            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
};

module.exports = gptController;
