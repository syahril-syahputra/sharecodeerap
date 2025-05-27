require('dotenv-safe').config({allowEmptyValues : true});

const gptService = require("../libs/service/gptService");
const { PrismaClient } = require('@prisma/client');
const sessionRepository = require("../libs/repositories/session-repository");
const promptRepository = require("../libs/repositories/prompt-repository");
const checkExpiredSessions = async ()=>{
    const expiredSessions = await sessionRepository.getExpiredSessions();

    for (const expiredSession of expiredSessions) {

        let prompts = await promptRepository.getPromptsBySession(expiredSession.id);
        expiredSession.Prompts = prompts;
        expiredSession.user = expiredSession.userId;

        await gptService.processSessionPrompt(expiredSession);
        console.log("Expiring session " + expiredSession.id);
    }
}
checkExpiredSessions();