require("dotenv-safe").config({ allowEmptyValues: true });
const mailchimp = require("@mailchimp/mailchimp_transactional")(
    process.env.MANDRILL_API_KEY
);
const { PrismaClient, MailLogType } = require("@prisma/client");
const prisma = new PrismaClient();
const { parentPort } = require("worker_threads");
var dayjs = require("dayjs");
const createFileTxt = require("../libs/helpers/generateTxt");
const { sendDailyRecapEmail, sendNewDailyRecapEmail } = require("../libs/service/mailchimpEmailService");
const dailyRecapService = require("../libs/service/dailyRecapService");
const generateSuggestion = (string) => {
    const list = string.split("\n- ")
    let result = `<div
                        style="
                            background-color: #cbe7fe;
                            display: flex;
                            align-items: center;
                            padding: 10px;
                            justify-items: center;
                        "
                    >
                    ${list.map(item => `<div
                                        style="
                                            background-color: #ffffff;
                                            margin: 0px 10px;
                                            padding: 10px;
                                            flex: 1 1 0%;
                                        "
                                    >${item}
                                </div>`)}
                            </div>`;
    return result;

}
(async () => {
    console.log(`## Creating Daily Recap for user`);
    dayjs.locale('en')
    const startDate = dayjs().startOf("day").toDate();
    const endDate = dayjs().endOf("day").toDate();

    const user = await prisma.user.findMany({
        where: {
            dailyRecap: true,
            dailyRecapMail: false
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
                dailyRecapMail : true
            },
            select : {
                Language : true,
                email : true,
                firstname: true
            }
        });
        const { email, Language, firstname } = updateUser
        // const { iso:locale } = Language
        const attachmentsTxt = await createFileTxt(prompt, "daily", undefined, firstname);
        const date = dayjs().format('dddd D MMMM YYYY')
        // const sendEmail = await sendDailyRecapEmail(email, firstname, date, defaultPrompt, quiz, stories, attachmentsTxt)
        const user = await prisma.user.findFirst({
            where : {
                id
            },
            include : {
                account : true
            }
        })


        let recap = await dailyRecapService.generateDailyRecap(user);
        const dailyRecap = recap.text.split("\n\n")[0];
        await sendNewDailyRecapEmail(
            user.email,
            user.firstname,
            dayjs().format('MMM, DD YYYY'),
            dailyRecap,
            generateSuggestion(recap.text.split("with Eureka:\n- ")[1]))

        const { id:userId } = user
        const { id:accountId } = user.account
        const mailLogCreate = await prisma.mailLog.create({
            data: {
                userId,
                accountId,
                type : MailLogType.DAILY_RECAP,
                message : `Daily recap for user ${user.firstname}`
            }
        })
    }

    if (parentPort) parentPort.postMessage("done");
    else process.exit(0);
})();
