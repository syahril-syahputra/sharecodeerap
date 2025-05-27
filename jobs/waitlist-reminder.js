require("dotenv-safe").config({ allowEmptyValues: true });
const mailchimp = require("@mailchimp/mailchimp_transactional")(
    process.env.MANDRILL_API_KEY
);
const { PrismaClient, WaitlistType, MailLogType} = require("@prisma/client");
const prisma = new PrismaClient();
const { parentPort } = require("worker_threads");
var dayjs = require("dayjs");
const mailchimpEmailService = require("../libs/service/mailchimpEmailService");

(async () => {
    console.log(`## Send Waitlist Reminder`);

    let now = dayjs().add(2, 'day');

    const startDate = now.startOf("day").toDate();
    const endDate = now.endOf("day").toDate();

    const contacts = await prisma.waitlist.findMany({
        where: {
            AND: [
                {
                    beforeExpiredMail: false,
                },
                {
                    expiredMail: false,
                },
                {
                    status: WaitlistType.INVITED,
                },
                {
                    inviteTokenExpires: {
                        gte: startDate,
                        lt: endDate
                    },
                },
            ]
        },
        select: {
            id: true,
            email: true,
            inviteToken: true,
            User : {
                select : {
                    account : true,
                    id: true
                }
            }
        }
    });

    for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];

        const update = await prisma.waitlist.update({
            where : {
                id : contact.id
            },
            data : {
                beforeExpiredMail : true
            }
        });
        const { id:userId } = contact.User
        const { id:accountId } = contact.User.account

        let mailLog = await prisma.mailLog.create({
            data : {
                userId,
                accountId,
                type: MailLogType.WAITLIST,
                message: "2 days before Expired waitlist"
            }
        });

        console.log(contact.email);
        const link = process.env.FRONTEND_URL + "/stripe/session-free-trial?token=" + contact.inviteToken
        const sendEmail = await mailchimpEmailService.sendInvitationExpiredTomorrow(contact.email, link);
    }

    const todayStartDate = dayjs().startOf("day").toDate();
    const todayEndDate = dayjs().endOf("day").toDate();

    const expireds = await prisma.waitlist.findMany({
        where: {
            AND: [
                {
                    expiredMail: false,
                },
                {
                    status: WaitlistType.INVITED,
                },
                {
                    inviteTokenExpires: {
                        gte: todayStartDate,
                        lt: todayEndDate
                    },
                },
            ]
        },
        select: {
            id: true,
            email: true,
            User : {
                select : {
                    id: true,
                    account : true
                }
            }
        }
    });

    for (let i = 0; i < expireds.length; i++) {
        const expired = expireds[i];
        // console.log(expired)
        const update = await prisma.waitlist.update({
            where : {
                id : expired.id
            },
            data : {
                beforeExpiredMail: true,
                expiredMail: true
            }
        });
        const { id:userId } = expired.User
        const { id:accountId } = expired.User.account
        let mailLog = await prisma.mailLog.create({
            data : {
                userId,
                accountId,
                type: MailLogType.TRIAL,
                message: "Expired waitlist"
            }
        });

        console.log(expired.email);

        const sendEmail = await mailchimpEmailService.sendInvitationExpiredAlready(contact.email);
    }

    if (parentPort) parentPort.postMessage("done");
    else process.exit(0);
})();
