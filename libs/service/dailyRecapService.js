const Sentry = require("@sentry/node");
const sessionRepository = require("../repositories/session-repository");
const promptService = require("./promptService");
const PromptType = require("../helpers/enums/PromptType");
const SessionHelper = require("../helpers/session");
const OpenAI = require("openai");
const SystemPromptRepository = require("../repositories/admin/system-prompt-repository");
const PromptRepository = require("../repositories/admin/prompt-repository");
const templateHelper = require("../helpers/template");
const openai = new OpenAI({
    apiKey: process.env.OPENAI_SECRET_KEY,
});

const dailyRecapService = {

    generateDailyRecap: async (user) => {
        try {

            let dailyRecapPrompt = await SystemPromptRepository.getPromptByType("DAILY_RECAP");
            if(!dailyRecapPrompt){
                throw new Error("User not found");
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0); // Set to start of today

            const endOfDay = new Date(today);
            endOfDay.setHours(23, 59, 59, 999); // Set to end of today
            let prompts = await PromptRepository.getPromptsByUserAndInterval(user.id, today, endOfDay);
            let transcript = SessionHelper.promptsToDigest(prompts);

            let filledPrompt = templateHelper.replacePlaceholders(dailyRecapPrompt.prompt, {
                user: JSON.stringify(user),
                transcript: transcript,
            });

            let requestParams = {
                model: dailyRecapPrompt?.Engine?.model || "gpt-3.5-turbo",
                temperature: dailyRecapPrompt.temperature || 0.7,
                max_tokens: dailyRecapPrompt.maxTokens || 150,
                top_p: dailyRecapPrompt.topP || 1.0,
                frequency_penalty: dailyRecapPrompt.frequencyPenalty || 0,
                presence_penalty: dailyRecapPrompt.presencePenalty || 0.0,
                messages: promptService.assembleChatGPTBriefedPrompt(
                    filledPrompt
                ),
            };

            // console.log(promptService.assembleChatGPTBriefedPrompt(
            //     filledPrompt
            // ))

            let response = await openai.chat.completions.create(requestParams);

            return {
                text: response.choices[0].message.content,
            };
        } catch (e) {
            console.log(e);
            console.error(e.response);
            Sentry.captureException(e);
        }
    },
}

module.exports = dailyRecapService;
