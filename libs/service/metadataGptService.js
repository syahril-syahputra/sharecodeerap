const Sentry = require("@sentry/node");
const promptService = require("./promptService");
const languageRepository = require("../repositories/language-repository");
const defaultPromptRepository = require("../repositories/default-prompt-repository");
const defaultPromptService = require("./defaultPromptService");

const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_SECRET_KEY,
});

const gptService = {
  /*
      Process Chat GPT Metadata
      */

  processMetadata: async (user, message) => {
    // We have to infer the initial prompt here
    let initialPrompt = await defaultPromptService.inferPromptForUser(user);
    if (!initialPrompt) {
      throw new Error("Couldn't get a default prompt");
    }

    // We hydrate it
    initialPrompt = await defaultPromptRepository.getPromptByIdForMetadata(
      initialPrompt.id
    );

    // Here we have to assets the type of requests, but for now we are going to suppose
    // is always the main request
    if (initialPrompt.metadataParams.Engine.model === "gpt-3.5-turbo") {
      return await gptService.processChatGPT(user, message, initialPrompt);
    } else {
      // return await gptService.processGPT(user, message);
    }
  },

  processGPT: async (user, message, session, type) => {
    try {
      return null;

      // // Now we have to get the latest briefed prompt and append it
      // let lastProcessPrompt = await sessionRepository.getLastProcessedPrompt(user.id);
      // let openAIparams
      // if(type === PromptType.DEFAULT){
      //     openAIparams = session.DefaultPrompt.mainParams;
      // }else if(type === PromptType.EXPLAIN_MORE){
      //     openAIparams = session.DefaultPrompt.explainMoreParams;
      // }else if(type === PromptType.FUN_FACTS){
      //     openAIparams = session.DefaultPrompt.funFactsParams;
      // }
      //
      // const response = await openai.createCompletion({
      //     model: openAIparams?.Engine?.model || "text-davinci-003",
      //     prompt: promptService.assemblePrompt(session, lastProcessPrompt, message),
      //     temperature: openAIparams.temperature || 0.9,
      //     max_tokens: openAIparams.maxTokens || 150,
      //     top_p: openAIparams.topP || 1,
      //     frequency_penalty: openAIparams.frequencyPenalty || 0,
      //     presence_penalty: openAIparams.presencePenalty || 0.6,
      //     best_of: openAIparams.bestOf || 1,
      //     stop: ["Human:", "AI:"],
      // });
      //
      // return {
      //     text: stringHelper.cleanString(response.data.choices[0].text),
      //     session: session,
      //     ...response.data.usage
      // };
    } catch (e) {
      console.error(e);
      Sentry.captureException(e);
    }
  },

  processChatGPT: async (user, message, initialPrompt) => {
    try {
      let language = await languageRepository.getLanguagesById(user.languageId);
      let openAIparams = initialPrompt.metadataParams;

      let messages = promptService.assembleMetadataMessages(
        initialPrompt,
        message,
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
        initialPrompt: initialPrompt,
        fullRequest: requestParams,
        ...response.usage,
      };
    } catch (e) {
      // console.log(e)
      console.error(e.response);
      Sentry.captureException(e);
    }
  },
};

module.exports = gptService;
