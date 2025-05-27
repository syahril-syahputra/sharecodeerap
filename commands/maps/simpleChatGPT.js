require("dotenv-safe").config({ allowEmptyValues: true });

const { PrismaClient } = require("@prisma/client");
const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_SECRET_KEY,
});

const simpleChatGPT = {
  requestChatGPT: async (messages) => {
    try {
      let requestParams = {
        model: "gpt-3.5-turbo",
        messages: messages,
        temperature: 0.7,
        max_tokens: 3400,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0.0,
      };

      const response = await openai.createChatCompletion(requestParams);

      return response.data.choices[0].message.content;
    } catch (e) {
      console.log(e);
      console.log(e?.response?.data);
    }
  },
};

module.exports = simpleChatGPT;
