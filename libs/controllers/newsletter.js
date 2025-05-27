const statuscodes = require('../helpers/statuscodes');
const { LogType, MailLogType } = require("@prisma/client")
const Sentry = require("@sentry/node");
const render = require('../helpers/render');
const logService = require("../service/logService");
const { joinNewsletter, findUserByEmail } = require('../repositories/user-repository');
const { sendWelcomeToNewsletter } = require('../service/mailchimpEmailService');

const newsletterController = {
    joinNewsletter : async (req, res) => {
        try {
            const { id, email } = req.user
            const update = await joinNewsletter(id)
            const sendEmail = await sendWelcomeToNewsletter(email)
            
            const user = await findUserByEmail(email)
            // const { id:userId, accountId } = user
            // await logService.createMailLog(req, {
            //     userId,
            //     accountId,
            //     type : MailLogType.NEWSLETTER,
            //     message : "Accepting Newsletter"
            // })


            render(res, statuscodes.OK, update)
        } catch (e) {
            console.error(e)
            Sentry.captureException(e)
        }
    }
}

module.exports = {
    ...newsletterController
}