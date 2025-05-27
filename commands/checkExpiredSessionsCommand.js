require('dotenv-safe').config({allowEmptyValues : true});

const sessionRepository = require("../libs/repositories/session-repository");
const promptRepository = require("../libs/repositories/prompt-repository");
const userRepository = require("../libs/repositories/user-repository");
const promptService = require("../libs/service/promptService");
const { PrismaClient } = require('@prisma/client');
const sessionHelper = require("../libs/helpers/session");
const prisma = new PrismaClient();

const checkExpiredSessions = async ()=>{

    // let a = {  name: "Michael",};
    // let processedPrompt = await sessionHelper.cleanJsonResponse(a);
    // console.log(processedPrompt)
    const expiredSessions = await sessionRepository.getExpiredSessions();

    for (const expiredSession of expiredSessions) {

        let prompts = await promptRepository.getPromptsBySession(expiredSession.id);
        expiredSession.Prompts = prompts;
        // let user = await userRepository.findUserById(expiredSession.userId);
        expiredSession.user = expiredSession.userId;

        await promptService.processSessionPrompt(expiredSession);
        console.log("expiring session " + expiredSession.id);
    }
}
checkExpiredSessions();