const Sentry = require("@sentry/node");
const promptRepository = require("../repositories/prompt-repository");
const languageRepository = require("../repositories/language-repository");
const sessionHelper = require("../helpers/session");
const PromptType = require("../helpers/enums/PromptType");
const templateHelper = require("../helpers/template");
const dateHelper = require("../helpers/datehelper");
const moment = require('moment');

const sessionService = {
    createPrompt: async (data) => {
        try {
            let prompt = await promptRepository.createPrompt(data);
            // console.log(prompt.type, 'TYPE');
            if (
                data.type === PromptType.DEFAULT_METADATA ||
                data.type === PromptType.DEFAULT
            ) {
                await promptRepository.manageUniqueTokenByType(prompt);
            }

            return prompt;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    assemblePrompt: (session, processedPrompt, message) => {
        // Initial Prompt
        // Here we will have to distinguish the type of request, if is normal, spell more etc
        // So we use a different prompt or the same one
        let response = session.DefaultPrompt.mainParams.prompt || "";

        if (processedPrompt && JSON.stringify(processedPrompt).length > 0) {
            response +=
                "\n\n The information that we know about the user is \n" +
                JSON.stringify(processedPrompt) +
                "\n";
        }

        let digestedPrompts = sessionHelper.promptsToDigest(session.Prompts);
        response += digestedPrompts + "\n" + "Human: " + message + "\nAI: ";

        return response;
    },
    assembleContinuePrompt: (promptMessage) => {
        let response = [
            {
                role: "system",
                content:
                    "You are a helpful assistant. please continue this response without re-write it again",
            },
            {
                role: "user",
                content: `continue this response : \n ${promptMessage}`,
            },
        ];
        return response;
    },

    assembleLlamaForCreatingQuiz: (topic, initialPrompt, user, language) => {
        if (!language) {
            language = languageRepository.getLanguagesById(1);
        }

        let data = {
            language: language,
            user: {...user, age: dateHelper.calculateAge(user.birthday)},
            topic: topic,
        };

        let systemPrompt = initialPrompt.quizParams.systemPrompt || "";
        let userPrompt = initialPrompt.quizParams.userPrompt || null;
        let assistantPrompt = initialPrompt.quizParams.assistantPrompt || null;
        let prompt = initialPrompt.quizParams.prompt || "";

        let result = [];
        result.push({
            role: "system",
            content: templateHelper.replacePlaceholders(systemPrompt, data),
        });
        if (userPrompt && userPrompt.length > 0) {
            result.push({
                role: "user",
                content: templateHelper.replacePlaceholders(userPrompt, data),
            });
            result.push({
                role: "assistant",
                content: templateHelper.replacePlaceholders(
                    assistantPrompt,
                    data
                ),
            });
        }
        result.push({
            role: "user",
            content: templateHelper.replacePlaceholders(prompt, data),
        });

        return result;
    },

    assembleLlamaForCreatingQuizUsingPrompt: (
        dataPrompt,
        initialPrompt,
        user,
        language
    ) => {
        if (!language) {
            language = languageRepository.getLanguagesById(1);
        }

        let data = {
            language: language,
            user: {...user, age: dateHelper.calculateAge(user.birthday)},
            prompt: dataPrompt,
            date: moment().format('dddd, MMMM DD, YYYY'),
        };

        let systemPrompt = initialPrompt.quizPromptParams.systemPrompt || "";
        let userPrompt = initialPrompt.quizPromptParams.userPrompt || null;
        let assistantPrompt =
            initialPrompt.quizPromptParams.assistantPrompt || null;
        let prompt = initialPrompt.quizPromptParams.prompt || "";

        let result = [];
        result.push({
            role: "system",
            content: templateHelper.replacePlaceholders(systemPrompt, data),
        });
        if (userPrompt && userPrompt.length > 0) {
            result.push({
                role: "user",
                content: templateHelper.replacePlaceholders(userPrompt, data),
            });
            result.push({
                role: "assistant",
                content: templateHelper.replacePlaceholders(
                    assistantPrompt,
                    data
                ),
            });
        }
        result.push({
            role: "user",
            content: templateHelper.replacePlaceholders(prompt, data),
        });

        return result;
    },

    assembleLlamaForQuizExplainMore: (quizEntry, initialPrompt, user, language) => {
        let data = {
            language: language,
            user: {...user, age: dateHelper.calculateAge(user.birthday)},
            quizEntry: quizEntry,
        };

        let systemPrompt =
            initialPrompt.quizExplainMoreParams.systemPrompt || "";
        let userPrompt = initialPrompt.quizExplainMoreParams.userPrompt || null;
        let assistantPrompt =
            initialPrompt.quizExplainMoreParams.assistantPrompt || null;
        let prompt = initialPrompt.quizExplainMoreParams.prompt || "";

        let result = [];
        result.push({
            role: "system",
            content: templateHelper.replacePlaceholders(systemPrompt, data),
        });
        if (userPrompt && userPrompt.length > 0) {
            result.push({
                role: "user",
                content: templateHelper.replacePlaceholders(userPrompt, data),
            });
            result.push({
                role: "assistant",
                content: templateHelper.replacePlaceholders(
                    assistantPrompt,
                    data
                ),
            });
        }
        result.push({
            role: "user",
            content: templateHelper.replacePlaceholders(prompt, data),
        });

        return result;
    },

    assembleLlama3Prompt: async (session, message, type, language, user) => {
        let result = [];
        let userPrompt, assistantPrompt, prompt;
        let systemPrompt;

        if (type === PromptType.DEFAULT) {
            systemPrompt = session.DefaultPrompt.mainParams.systemPrompt || "";
            userPrompt = session.DefaultPrompt.mainParams.userPrompt || "";
            assistantPrompt =
                session.DefaultPrompt.mainParams.assistantPrompt || "";
            prompt = session.DefaultPrompt.mainParams.prompt || "";
        } else if (type === PromptType.EXPLAIN_MORE) {
            systemPrompt =
                session.DefaultPrompt.explainMoreParams.systemPrompt || "";
            prompt = session.DefaultPrompt.explainMoreParams.prompt || "";
        } else if (type === PromptType.FUN_FACTS) {
            systemPrompt =
                session.DefaultPrompt.funFactsParams.systemPrompt || "";
            prompt = session.DefaultPrompt.funFactsParams.prompt || "";
        }
        if (!language) {
            language = languageRepository.getLanguagesById(38);
        }

        let data = {
            language: language,
            user: {...user, age: dateHelper.calculateAge(user.birthday)},
            message: message,
            date: moment().format('dddd, MMMM DD, YYYY'),
        };

        // System Prompt
        result.push({
            role: "system",
            content: templateHelper.replacePlaceholders(systemPrompt, data),
        });

        // We add initial context using the user
        if (type === PromptType.DEFAULT) {
            if (userPrompt && userPrompt.length > 0) {
                result.push({
                    role: "user",
                    content: templateHelper.replacePlaceholders(
                        userPrompt,
                        data
                    ),
                });
                result.push({
                    role: "assistant",
                    content: templateHelper.replacePlaceholders(
                        assistantPrompt,
                        data
                    ),
                });
            }

            if (session) {
                let prompts = session?.Prompts || [];
                if (session.Prompts && session.Prompts.length < 20) {
                    prompts = await promptRepository.getLast20PromptsByUser(user.id);
                }

                for (const prompt of prompts) {
                    if (prompt.type === PromptType.DEFAULT) {
                        result.push({role: "user", content: prompt.request});
                        result.push({
                            role: "assistant",
                            content: prompt.response,
                        });
                    }
                }
            }
        }

        result.push({
            role: "user",
            content: templateHelper.replacePlaceholders(prompt, data),
        });

        return result;
    },
    // The different roles are:
    // system: initial prompt
    // user: user messages
    // assistant: ChatGPT responses
    assembleChatGPTPrompt: async (
        session,
        processedPrompt,
        message,
        type,
        language,
        user
    ) => {
        let result = [];
        let userPrompt, assistantPrompt, prompt;

        let systemPrompt;
        if (type === PromptType.DEFAULT) {
            systemPrompt = session.DefaultPrompt.mainParams.systemPrompt || "";
            userPrompt = session.DefaultPrompt.mainParams.userPrompt || "";
            assistantPrompt =
                session.DefaultPrompt.mainParams.assistantPrompt || "";
            prompt = session.DefaultPrompt.mainParams.prompt || "";
        } else if (type === PromptType.EXPLAIN_MORE) {
            systemPrompt =
                session.DefaultPrompt.explainMoreParams.systemPrompt || "";
            prompt = session.DefaultPrompt.explainMoreParams.prompt || "";
        } else if (type === PromptType.FUN_FACTS) {
            systemPrompt =
                session.DefaultPrompt.funFactsParams.systemPrompt || "";
            prompt = session.DefaultPrompt.funFactsParams.prompt || "";
        }

        if (!language) {
            language = languageRepository.getLanguagesById(38);
        }
        let data = {
            language: language,
            user: {...user, age: dateHelper.calculateAge(user.birthday)},
            message: message,
            date: moment().format('dddd, MMMM DD, YYYY'),
        };

        // System Prompt
        result.push({
            role: "system",
            content: templateHelper.replacePlaceholders(systemPrompt, data),
        });

        // We add initial context using the user
        if (type === PromptType.DEFAULT) {
            if (userPrompt && userPrompt.length > 0) {
                result.push({
                    role: "user",
                    content: templateHelper.replacePlaceholders(
                        userPrompt,
                        data
                    ),
                });
                result.push({
                    role: "assistant",
                    content: templateHelper.replacePlaceholders(
                        assistantPrompt,
                        data
                    ),
                });
            }


            // We get the maximum between the prompts for this session or the last 20 prompts
            if (session) {
                //TODO Check if the length is already n -> get 20 minus n 
                let prompts = session?.Prompts || [];
                if (session.Prompts && session.Prompts.length < 20) {
                    prompts = await promptRepository.getLast20PromptsByUser(user.id);
                }

                for (const prompt of prompts) {
                    if (prompt.type === PromptType.DEFAULT) {
                        result.push({role: "user", content: prompt.request});
                        result.push({
                            role: "assistant",
                            content: prompt.response,
                        });
                    }
                }
            }

        }

        result.push({
            role: "user",
            content: templateHelper.replacePlaceholders(prompt, data),
        });

        return result;
    },

    // The different roles are:
    // system: initial prompt
    // user: user messages
    // assistant: ChatGPT responses
    assembleChatGPTBriefedPrompt: (message) => {
        let result = [];
        result.push({role: "system", content: message});
        return result;
    },

    // The different roles are:
    // system: initial prompt
    // user: user messages
    // assistant: ChatGPT responses
    assembleChatGPTForFacts: (topic, initialPrompt, language, user) => {
        if (!language) {
            language = languageRepository.getLanguagesById(1);
        }
        let data = {
            language: language,
            user: {...user, age: dateHelper.calculateAge(user.birthday)},
            topic: topic.name,
        };

        let systemPrompt = initialPrompt.factParams.systemPrompt || "";
        let userPrompt = initialPrompt.factParams.userPrompt || null;
        let assistantPrompt = initialPrompt.factParams.assistantPrompt || null;
        let prompt = initialPrompt.factParams.prompt || "";

        let result = [];
        result.push({
            role: "system",
            content: templateHelper.replacePlaceholders(systemPrompt, data),
        });
        if (userPrompt && userPrompt.length > 0) {
            result.push({
                role: "user",
                content: templateHelper.replacePlaceholders(userPrompt, data),
            });
            result.push({
                role: "assistant",
                content: templateHelper.replacePlaceholders(
                    assistantPrompt,
                    data
                ),
            });
        }
        result.push({
            role: "user",
            content: templateHelper.replacePlaceholders(prompt, data),
        });

        return result;
    },
    assembleChatGPTForFactsUsingPrompt: (
        dataPrompt,
        initialPrompt,
        language,
        user
    ) => {
        if (!language) {
            language = languageRepository.getLanguagesById(1);
        }
        let data = {
            language: language,
            user: {...user, age: dateHelper.calculateAge(user.birthday)},
            topic: dataPrompt.request,
        };

        let systemPrompt = initialPrompt.factParams.systemPrompt || "";
        let userPrompt = initialPrompt.factParams.userPrompt || null;
        let assistantPrompt = initialPrompt.factParams.assistantPrompt || null;
        let prompt = initialPrompt.factParams.prompt || "";

        let result = [];
        result.push({
            role: "system",
            content: templateHelper.replacePlaceholders(systemPrompt, data),
        });
        if (userPrompt && userPrompt.length > 0) {
            result.push({
                role: "user",
                content: templateHelper.replacePlaceholders(userPrompt, data),
            });
            result.push({
                role: "assistant",
                content: templateHelper.replacePlaceholders(
                    assistantPrompt,
                    data
                ),
            });
        }
        result.push({
            role: "user",
            content: templateHelper.replacePlaceholders(prompt, data),
        });

        return result;
    },

    assembleGPTForStories: (topics, initialPrompt, language, user) => {
        if (!language) {
            language = languageRepository.getLanguagesById(1);
        }
        let data = {
            language: language,
            user: {...user, age: dateHelper.calculateAge(user.birthday)},
            topics: topics.join(", "),
        };

        let systemPrompt = initialPrompt.storyParams.systemPrompt || "";
        let userPrompt = initialPrompt.storyParams.userPrompt || null;
        let assistantPrompt = initialPrompt.storyParams.assistantPrompt || null;
        let prompt = initialPrompt.storyParams.prompt || "";

        // if (processedPrompt && JSON.stringify(processedPrompt).length > 0) {
        //     response += "\n\n The information that we know about the user is \n" + JSON.stringify(processedPrompt) + "\n";
        // }

        let response =
            templateHelper.replacePlaceholders(systemPrompt, data) + "\n";
        if (userPrompt && userPrompt.length > 0) {
            response +=
                "\nHuman: " +
                templateHelper.replacePlaceholders(userPrompt, data) +
                "\nAI: " +
                templateHelper.replacePlaceholders(assistantPrompt, data) +
                "\n";
        }

        response +=
            "Human: " +
            templateHelper.replacePlaceholders(prompt, data) +
            "\nAI: ";

        return response;
    },
    assembleChatGPTForTypeOfStory: (
        user,
        typeOfStory,
        storyParam,
        language,
        initialPrompt
    ) => {
        if (!language) {
            language = languageRepository.getLanguagesById(1);
        }
        let data = {
            language,
            user: {...user, age: dateHelper.calculateAge(user.birthday)},
            typeOfStory,
        };

        data.storyParam = storyParam
            .map((e) => {
                return `${e.Topic.name} as a ${e.name}`;
            })
            .join(", ");

        let systemPrompt = initialPrompt.customStoryParams.systemPrompt || "";
        let userPrompt = initialPrompt.customStoryParams.userPrompt || null;
        let assistantPrompt =
            initialPrompt.customStoryParams.assistantPrompt || null;
        let prompt = initialPrompt.customStoryParams.prompt || "";

        let result = [];
        result.push({
            role: "system",
            content: templateHelper.replacePlaceholders(systemPrompt, data),
        });
        if (userPrompt && userPrompt.length > 0) {
            result.push({
                role: "user",
                content: templateHelper.replacePlaceholders(userPrompt, data),
            });
            result.push({
                role: "assistant",
                content: templateHelper.replacePlaceholders(
                    assistantPrompt,
                    data
                ),
            });
        }
        result.push({
            role: "user",
            content: templateHelper.replacePlaceholders(prompt, data),
        });

        return result;
    },
    assembleChatGPTForFollowStory: (text, prompt, language) => {
        let result = [];
        result.push({
            role: "user",
            content: `Please rewrite and continue this story : \n${prompt}\n and add more options like : \n${text}.\n Using ${language.name} Language`,
        });

        return result;
    },
    assembleChatGPTForStories: (topics, initialPrompt, language, user) => {
        if (!language) {
            language = languageRepository.getLanguagesById(1);
        }
        let data = {
            language: language,
            user: {...user, age: dateHelper.calculateAge(user.birthday)},
            topics: topics.join(", "),
        };

        let systemPrompt = initialPrompt.storyParams.systemPrompt || "";
        let userPrompt = initialPrompt.storyParams.userPrompt || null;
        let assistantPrompt = initialPrompt.storyParams.assistantPrompt || null;
        let prompt = initialPrompt.storyParams.prompt || "";

        let result = [];
        result.push({
            role: "system",
            content: templateHelper.replacePlaceholders(systemPrompt, data),
        });
        if (userPrompt && userPrompt.length > 0) {
            result.push({
                role: "user",
                content: templateHelper.replacePlaceholders(userPrompt, data),
            });
            result.push({
                role: "assistant",
                content: templateHelper.replacePlaceholders(
                    assistantPrompt,
                    data
                ),
            });
        }
        result.push({
            role: "user",
            content: templateHelper.replacePlaceholders(prompt, data),
        });

        return result;
    },

    assembleChatGPTForCreatingQuiz: (topic, initialPrompt, language, user) => {
        if (!language) {
            language = languageRepository.getLanguagesById(1);
        }
        let data = {
            language: language,
            user: {...user, age: dateHelper.calculateAge(user.birthday)},
            topic: topic,
        };

        let systemPrompt = initialPrompt.quizParams.systemPrompt || "";
        let userPrompt = initialPrompt.quizParams.userPrompt || null;
        let assistantPrompt = initialPrompt.quizParams.assistantPrompt || null;
        let prompt = initialPrompt.quizParams.prompt || "";

        let result = [];
        result.push({
            role: "system",
            content: templateHelper.replacePlaceholders(systemPrompt, data),
        });
        if (userPrompt && userPrompt.length > 0) {
            result.push({
                role: "user",
                content: templateHelper.replacePlaceholders(userPrompt, data),
            });
            result.push({
                role: "assistant",
                content: templateHelper.replacePlaceholders(
                    assistantPrompt,
                    data
                ),
            });
        }
        result.push({
            role: "user",
            content: templateHelper.replacePlaceholders(prompt, data),
        });

        return result;
    },
    assembleChatGPTForCreatingQuizAndPrompt: (
        dataPrompt,
        initialPrompt,
        language,
        user
    ) => {
        if (!language) {
            language = languageRepository.getLanguagesById(1);
        }
        let data = {
            language: language,
            user: {...user, age: dateHelper.calculateAge(user.birthday)},
            prompt: dataPrompt,
        };

        let systemPrompt = initialPrompt.quizPromptParams.systemPrompt || "";
        let userPrompt = initialPrompt.quizPromptParams.userPrompt || null;
        let assistantPrompt =
            initialPrompt.quizPromptParams.assistantPrompt || null;
        let prompt = initialPrompt.quizPromptParams.prompt || "";

        let result = [];
        result.push({
            role: "system",
            content: templateHelper.replacePlaceholders(systemPrompt, data),
        });
        if (userPrompt && userPrompt.length > 0) {
            result.push({
                role: "user",
                content: templateHelper.replacePlaceholders(userPrompt, data),
            });
            result.push({
                role: "assistant",
                content: templateHelper.replacePlaceholders(
                    assistantPrompt,
                    data
                ),
            });
        }
        result.push({
            role: "user",
            content: templateHelper.replacePlaceholders(prompt, data),
        });

        return result;
    },

    // The different roles are:
    // system: initial prompt
    // user: user messages
    // assistant: ChatGPT responses
    assembleMetadataMessages: (initialPrompt, message, language, user) => {
        let result = [];
        let systemPrompt = initialPrompt.metadataParams.systemPrompt || "";
        let prompt = initialPrompt.metadataParams.prompt || "";

        if (!language) {
            language = languageRepository.getLanguagesById(1);
        }
        let data = {
            language: language,
            user: {...user, age: dateHelper.calculateAge(user.birthday)},
            message: message,
        };

        result.push({
            role: "system",
            content: templateHelper.replacePlaceholders(systemPrompt, data),
        });
        result.push({
            role: "user",
            content: templateHelper.replacePlaceholders(prompt, data),
        });

        return result;
    },

    assembleChatGPTForQuizExplainMore: (
        quizEntry,
        initialPrompt,
        language,
        user
    ) => {
        if (!language) {
            language = languageRepository.getLanguagesById(1);
        }
        let data = {
            language: language,
            user: {...user, age: dateHelper.calculateAge(user.birthday)},
            quizEntry: quizEntry,
        };

        let systemPrompt =
            initialPrompt.quizExplainMoreParams.systemPrompt || "";
        let userPrompt = initialPrompt.quizExplainMoreParams.userPrompt || null;
        let assistantPrompt =
            initialPrompt.quizExplainMoreParams.assistantPrompt || null;
        let prompt = initialPrompt.quizExplainMoreParams.prompt || "";

        let result = [];
        result.push({
            role: "system",
            content: templateHelper.replacePlaceholders(systemPrompt, data),
        });
        if (userPrompt && userPrompt.length > 0) {
            result.push({
                role: "user",
                content: templateHelper.replacePlaceholders(userPrompt, data),
            });
            result.push({
                role: "assistant",
                content: templateHelper.replacePlaceholders(
                    assistantPrompt,
                    data
                ),
            });
        }
        result.push({
            role: "user",
            content: templateHelper.replacePlaceholders(prompt, data),
        });

        return result;
    },

    assembleChatGPTForIdle: (conversation, initialPrompt, language, user) => {
        if (!language) {
            language = languageRepository.getLanguagesById(1);
        }
        let data = {
            language: language,
            user: {...user, age: dateHelper.calculateAge(user.birthday)},
            conversation: conversation,
        };

        let systemPrompt = initialPrompt.IdleParams.systemPrompt || "";
        let prompt = initialPrompt.IdleParams.prompt || "";

        let result = [];
        result.push({
            role: "system",
            content: templateHelper.replacePlaceholders(systemPrompt, data),
        });
        result.push({
            role: "user",
            content: templateHelper.replacePlaceholders(prompt, data),
        });

        return result;
    },

    assembleDalle: (concept, initialPrompt, language, user) => {
        let result = [];
        let systemPrompt = initialPrompt.dalleParams.systemPrompt || "";
        let prompt = initialPrompt.dalleParams.prompt || "";

        if (!language) {
            language = languageRepository.getLanguagesById(1);
        }
        let data = {
            language: language,
            user: {...user, age: dateHelper.calculateAge(user.birthday)},
            concept: concept,
        };

        return templateHelper.replacePlaceholders(prompt, data);
    },
    assembleChatGPTForContext: (text, initialPrompt, language, user) => {
        if (!language) {
            language = languageRepository.getLanguagesById(1);
        }
        let data = {
            language: language,
            user: {...user, age: dateHelper.calculateAge(user.birthday)},
            text: text,
        };

        let systemPrompt = initialPrompt.contextParams.systemPrompt || "";
        let userPrompt = initialPrompt.contextParams.userPrompt || null;
        let assistantPrompt =
            initialPrompt.contextParams.assistantPrompt || null;
        let prompt = initialPrompt.contextParams.prompt || "";

        let result = [];
        result.push({
            role: "system",
            content: templateHelper.replacePlaceholders(systemPrompt, data),
        });
        if (userPrompt && userPrompt.length > 0) {
            result.push({
                role: "user",
                content: templateHelper.replacePlaceholders(userPrompt, data),
            });
            result.push({
                role: "assistant",
                content: templateHelper.replacePlaceholders(
                    assistantPrompt,
                    data
                ),
            });
        }
        result.push({
            role: "user",
            content: templateHelper.replacePlaceholders(prompt, data),
        });

        return result;
    },
    assembleChatGPTForEmojis: (text, initialPrompt, language, user) => {
        if (!language) {
            language = languageRepository.getLanguagesById(1);
        }
        let data = {
            language: language,
            user: {...user, age: dateHelper.calculateAge(user.birthday)},
            text: text,
        };

        let systemPrompt = initialPrompt.emojisParams.systemPrompt || "";
        let userPrompt = initialPrompt.emojisParams.userPrompt || null;
        let assistantPrompt =
            initialPrompt.emojisParams.assistantPrompt || null;
        let prompt = initialPrompt.emojisParams.prompt || "";

        let result = [];
        result.push({
            role: "system",
            content: templateHelper.replacePlaceholders(systemPrompt, data),
        });
        if (userPrompt && userPrompt.length > 0) {
            result.push({
                role: "user",
                content: templateHelper.replacePlaceholders(userPrompt, data),
            });
            result.push({
                role: "assistant",
                content: templateHelper.replacePlaceholders(
                    assistantPrompt,
                    data
                ),
            });
        }
        result.push({
            role: "user",
            content: templateHelper.replacePlaceholders(prompt, data),
        });

        return result;
    },
};
module.exports = sessionService;
