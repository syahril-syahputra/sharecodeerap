require('dotenv-safe').config({allowEmptyValues : true});

const gptService = require("../libs/service/gptService");
const { PrismaClient, PromptType } = require('@prisma/client');
const promptRepository = require("../libs/repositories/prompt-repository");
const userRepository = require('../libs/repositories/user-repository');
const { default: OpenAI } = require('openai');

const prisma = new PrismaClient();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_SECRET_KEY,
});

const migrateGPTPrompt = async () => {

    const users = await prisma.user.findMany({
        where: {
            id: 505
        }
    });

    for (const user of users) {
        if (!user.threadId) {
            const thread = await openai.beta.threads.create();
            await userRepository.updateThreadId(user.id, thread.id);
            user.threadId = thread.id
        }

        const prompts = await prisma.prompt.findMany({
            where: {
                userId: user.id,
                type: PromptType.DEFAULT
            }
        })

        let message = "This is the history of user's asking, 'user:' meant its from the user and 'assistants:' meant its from gpt.\n"

        for (const prompt of prompts) {
            message = message + 'user: ' + prompt.request + '\nassistant: ' + prompt.response + "\n"
        }

        const requestMessage = await openai.beta.threads.messages.create(
            user.threadId,
            { role: "user", 
              content: message
            }
          );

        const run = await openai.beta.threads.runs.create(
            user.threadId,
            { 
              assistant_id: process.env.ASSISTANT_ID
            }
        );


    }

}
migrateGPTPrompt();