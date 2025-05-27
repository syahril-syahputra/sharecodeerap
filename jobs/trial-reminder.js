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
    console.log(`## Send Trial Reminder`);

    const today = dayjs().startOf('day');
    const endDate = today.add('3', 'day').toDate()

    const contacts = await prisma.account.findMany({
        where: {
            AND: [
                {
                    subscriptionStatus: "trialing",
                },
                {
                    subscriptionCurrentPeriodEnd: {
                        gte: today.toDate(),
                        lte: endDate
                    },
                },
                {
                    User : {
                        every : {
                            trialReminder : false
                        }
                    }
                }
            ]
        },
        select: {
            id: true,
            email: true,
            User : {
                select : {
                    id : true
                }
            }
        }
    });

    for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];
        const id = contact.User[0].id
        const updateUser = await prisma.user.update({
            where : {
                id
            },
            data : {
                trialReminder : true
            }
        })
        let mailLog = await prisma.mailLog.create({
            data : {
                userId : id,
                accountId: contact.id,
                type: MailLogType.TRIAL,
                message: "Free trial expired"
            }
        });

        console.log(contact.email);

        // const sendEmail = await mailchimpEmailService.sendInvitationExpiredAlready(contact.email);
    }

    if (parentPort) parentPort.postMessage("done");
    else process.exit(0);
})();
