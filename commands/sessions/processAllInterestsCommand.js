require('dotenv-safe').config({allowEmptyValues : true});

const gptService = require("../../libs/service/gptService");
const { PrismaClient } = require('@prisma/client');
const userRepository = require("../../libs/repositories/user-repository");
const prisma = new PrismaClient();

const run = async ()=>{

    let users = await prisma.user.findMany({
        include: {
            Session: {
                include: {
                    Prompts: true
                }
            }
        },
    });

    for (const user of users) {
        console.log("Processing user: ", user.id);

        // if(user.id < 141)continue

        for (const session of user.Session) {
            console.log("Processing session: ", session.id);
            await gptService.processSessionPrompt(session);

            // console.log("finish")
            // process.exit(0)
        }
    }

}
run();