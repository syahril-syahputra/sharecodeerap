require('dotenv-safe').config({allowEmptyValues : true});

const gptService = require("../libs/service/gptService");
const { PrismaClient } = require('@prisma/client');
const sessionRepository = require("../libs/repositories/session-repository");
const promptRepository = require("../libs/repositories/prompt-repository");
const prisma = new PrismaClient();

const processPrompt = async ()=>{
    const session = await prisma.session.findFirst({
        where: {
            id : 797,
        },
        include: {
            Prompts: true
        },
        orderBy: [
            {
                id: 'desc',
            },
        ],
    });

    await gptService.processSessionPrompt(session);
}
processPrompt();