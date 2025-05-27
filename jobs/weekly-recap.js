const {PrismaClient, MailLogType} = require('@prisma/client');
const prisma = new PrismaClient();
const Sentry = require("@sentry/node");
const { parentPort } = require('worker_threads');
var dayjs = require('dayjs');
const createFileTxt = require('../libs/helpers/generateTxt');

(async () => {

    console.log(`## Creating Weekly Recap for user`);

    const startDate = dayjs().startOf("week").toDate();
    const endDate = dayjs().endOf("week").toDate();

    const user = await prisma.user.findMany({
        where: {
            weeklyRecap: true,
            weeklyRecapMail : false
        },
        select: {
            id: true,
        },
        take : 20
    });
    const listUserId = user.map(({ id }) => id);

    for (let i = 0; i < listUserId.length; i++) {
        const id = listUserId[i];
        const prompt = await prisma.prompt.findMany({
            where: {
                userId: parseInt(id),
                type: "DEFAULT",
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            select: {
                response: true,
                request: true,
                createdAt: true,
            },
        });
        const defaultPrompt = await prisma.prompt.count({
            where : {
                userId: parseInt(id),
                type: "DEFAULT",
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        })
        const quiz = await prisma.quiz.count({
            where : {
                userId: parseInt(id),
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        })
        const stories = await prisma.prompt.count({
            where : {
                userId: parseInt(id),
                type: "STORY",
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        })
        const updateUser = await prisma.user.update({
            where : {
                id : id
            },
            data : {
                weeklyRecapMail : true
            },
            select : {
                Language : true,
                email : true,
                firstname: true
            }
        });
        const { email, Language, firstname } = updateUser
        // const { iso:locale } = Language
        const attachmentsTxt = await createFileTxt(prompt, "daily", undefined, firstname);  //use undefined for a while, locale will use en for this time
        const date = dayjs().format('dddd D MMMM YYYY')
        const sendEmail = await sendDailyRecapEmail(email, firstname, date, defaultPrompt, quiz, stories, attachmentsTxt)   
        const user = await prisma.user.findFirst({
            where : {
                id
            },
            include : {
                account : true
            }
        })

        const { id:userId } = user
        const { id:accountId } = user.account
        const mailLogCreate = await prisma.mailLog.create({
            data: {
                userId,
                accountId,
                type : MailLogType.WEEKLY_RECAP,
                message : `Weekly recap for user ${user.firstname}`
            }
        })
    }

    if(parentPort) parentPort.postMessage('done')
    else process.exit(0)
})();