const render = require("../../helpers/render");
const statuscodes = require("../../helpers/statuscodes");
const Sentry = require("@sentry/node");
const {getPaginationParameters} = require("../../helpers/pagination");
const {getAllWaitlist,  deleteWaitlistDB, createWaitlistDB, editWaitlistDB, inviteDB, findOneById} = require("../../repositories/admin/waitlist-repository");
const {isEmailExist, findOneByEmail} = require("../../repositories/waitlist-repository");
const crypto = require("crypto");
const {sendLocalTemplateEmail} = require("../../helpers/aws-ses");
const mailchimpContactsService = require("../../service/mailchimpContactsService");
const normalizeEmail = require('normalize-email');
const mailchimpEmailService = require("../../service/mailchimpEmailService");
const logService = require("../../service/logService");
const { MailLogType } = require("@prisma/client");

const adminWaitlistController = {

    createWaitlist:  async (req, res) => {
        try {

            const isExist = await isEmailExist(req.body.email)
            if(isExist) {
                render(res, 200, statuscodes.WAITLIST_EXISTS, {});
                return;
            }

            const user = await findOneByEmail(req.body.email)
            const { id:userId } = user.User
            const { id:accountId } = user.User.account

            let result = await createWaitlistDB({email: req.body.email})

            if(req.body.mailchimp){
                // await mailchimpContactsService.createWaitlistContact(normalizeEmail(req.body.email));
            }

            await mailchimpEmailService.sendWaitlistEmail(req.body.email);
            await logService.createMailLog(req, {
                userId,
                accountId,
                type : MailLogType.WAITLIST,
                message : "ADDED TO WAITLIST"
            })
            
            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },

    editWaitlist:  async (req, res) => {
        try {
            const existingWaitlist = await findOneById(parseInt(req.params.id))
            if(!existingWaitlist) {
                render(res, 200, statuscodes.NOT_FOUND, {});
                return;
            }
            let oldEmail = existingWaitlist.email;

            let result = await editWaitlistDB(req.body, parseInt(req.params.id))

            // await mailchimpContactsService.editEmailWaitlistContact(normalizeEmail(oldEmail), normalizeEmail(req.body.email));

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },

    getWaitlist:  async (req, res) => {
        try {
            let paginationParameters = getPaginationParameters(req);
            let result = await getAllWaitlist(paginationParameters)

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    deleteWaitlist:  async (req, res) => {
        try {
            const existingWaitlist = await findOneById(parseInt(req.params.id))
            if(!existingWaitlist) {
                render(res, 200, statuscodes.NOT_FOUND, {});
                return;
            }
            let email = existingWaitlist.email;

            let result = await deleteWaitlistDB(parseInt(req.params.id));
            // await mailchimpContactsService.deleteWaitlistContact(normalizeEmail(email));

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    invite:  async (req, res) => {
        try {

            const user = await findOneById(parseInt(req.params.id))
            if(!user) {
                render(res, 200, statuscodes.NOT_FOUND, {});
                return;
            }

            const inviteToken = crypto.randomBytes(16).toString("hex");
            let result = await inviteDB(user.id, inviteToken, req.user.id)
            if(!result){
                Sentry.captureException("Error inviting user");
                render(res, 200, statuscodes.INTERNAL_ERROR, null);
                return;
            }

            const link = process.env.FRONTEND_URL + "/stripe/session-free-trial?token=" + inviteToken
            // await mailchimpContactsService.inviteWaitlistContact(normalizeEmail(user.email));
            await mailchimpEmailService.sendInvitedToFreeTrial(user.email, link);

            render(res, 200, statuscodes.OK, inviteToken);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },

}

module.exports = adminWaitlistController; 