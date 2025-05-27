const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_SECRET_KEY,
});

const service = {
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

      let response = await openai.chat.completions.create(requestParams);
      // console.log(response.choices[0].message.content)
      return response.choices[0].message.content;
    } catch (e) {
      console.log(e);
      console.log(e?.response?.data);
    }
  },
};

module.exports = service;
