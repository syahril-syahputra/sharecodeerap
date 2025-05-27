require("dotenv-safe").config({ allowEmptyValues: true });
const mailchimp = require("@mailchimp/mailchimp_transactional")(
    process.env.MANDRILL_API_KEY
);
const { PrismaClient, MailLogType} = require("@prisma/client");
const prisma = new PrismaClient();
const { parentPort } = require("worker_threads");
var dayjs = require("dayjs");
const mailchimpEmailService = require("../libs/service/mailchimpEmailService");

(async () => {
    console.log(`## Send Newsletter Reminder`);

    let now = dayjs().subtract(3, 'day');

    const startDate = now.startOf("day").toDate();
    const endDate = now.endOf("day").toDate();

    const contacts = await prisma.user.findMany({
        where: {
            AND: [
                {
                    isJoinNewsletter: true,
                },
                {
                    joinNewsletterAt: {
                        gte: startDate,
                        lt: endDate
                    },
                },
            ]
        },
        select: {
            id: true,
            email: true,
            account : true
        }
    });

    for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];

        const { id:userId } = contact
        const { id:accountId } = contact.account
        let mailLog = await prisma.mailLog.create({
            data : {
                accountId,
                userId,
                type: MailLogType.NEWSLETTER,
                message: "3 days after join newsletter"
            }
        });

        console.log(contact.email);

        const sendEmail = await mailchimpEmailService.sendTryOurApp(contact.email);
    }

    let day5 = dayjs().subtract(5, 'day');

    const todayStartDate = day5.startOf("day").toDate();
    const todayEndDate = day5.endOf("day").toDate();

    const expireds = await prisma.user.findMany({
        where: {
            AND: [
                {
                    isJoinNewsletter: true,
                },
                {
                    joinNewsletterAt: {
                        gte: todayStartDate,
                        lt: todayEndDate
                    },
                },
            ]
        },
        select: {
            id: true,
            email: true,
            account : true
        }
    });

    for (let i = 0; i < expireds.length; i++) {
        const expired = expireds[i];
        const { id:userId } = expired
        const { id:accountId } = expired.account
        let mailLog = await prisma.mailLog.create({
            data : {
                accountId,
                userId,
                type: MailLogType.NEWSLETTER,
                message: "5 days after join newsletter"
            }
        });

        console.log(contact.email);

        const sendEmail = await mailchimpEmailService.sendJoinFreeTrialWaitingList(contact.email);
    }

    if (parentPort) parentPort.postMessage("done");
    else process.exit(0);
})();
