require("dotenv-safe").config({ allowEmptyValues: true });
const mailchimp = require("@mailchimp/mailchimp_transactional")(
    process.env.MANDRILL_API_KEY
);
const { PrismaClient, MailLogType } = require("@prisma/client");
const prisma = new PrismaClient();
const { parentPort } = require("worker_threads");
var dayjs = require("dayjs");
const mailchimpEmailService = require("../libs/service/mailchimpEmailService");

(async () => {
    console.log(`## Send Feedback Reminder`);

    let now = dayjs().subtract(5, "day");

    const startDate = now.startOf("day").toDate();
    const endDate = now.endOf("day").toDate();

    const contacts = await prisma.account.findMany({
        where: {
            subscriptionStatus: "active",
            subscriptionCurrentPeriodStart: {
                gte: startDate,
                lt: endDate,
            },
            User : {
               every : {
                feedbackReminder : false
               }
            }
        },
        select: {
            id: true,
            email: true,
            User : {
                select : {
                    id : true,
                    firstname : true,
                    lastname : true
                }
            }
        },
    });

    for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];
        const user = contact.User[0]
        const userUpdate = await prisma.user.update({
            where : {
                id : user.id
            },
            data : {
                feedbackReminder : true 
            }
        })
        const { id:userId } = user
        const { id:accountId } = contact
        let mailLog = await prisma.mailLog.create({
            data: {
                userId,
                accountId,
                type: MailLogType.FEEDBACK,
                message: "Request feedback",
            },
        });
 
        const name = `${user.firstname}`
        const sendEmailFeedBack = await mailchimpEmailService.sendFeedbackEmail(contact.email, name);

    }

    if (parentPort) parentPort.postMessage("done");
    else process.exit(0);
})();
