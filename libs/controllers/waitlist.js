const { isUserEmailExist, findUserById, findUserByEmail } = require("../repositories/user-repository");
const Joi = require("joi");
const statuscodes = require("../helpers/statuscodes");
const render = require("../helpers/render");
const { createWaitlist, isEmailExist, findOneByEmail, getAllTrialing, create7DaysTrial } = require("../repositories/waitlist-repository");
const mailchimpContactsService = require("../service/mailchimpContactsService");
const {WaitlistType} = require("@prisma/client");
const normalizeEmail = require('normalize-email');
const mailchimpEmailService = require("../service/mailchimpEmailService");
const crypto = require("crypto");
const { getManyTrialing } = require("../repositories/account-repository");
const { createCheckoutWithFreeTrialSession, createFreeTrialSessionUrl } = require("./stripe/stripe");
const { getLanguagesById } = require("../repositories/language-repository");

const waitlistController = {
    addWaitList: async (req, res) => {
        try {

            const schema = Joi.object({
                email : Joi.string().required().email()
            });

            const {error, value} = schema.validate(req.body);
            if (error) {
                render(res, 400, statuscodes.VALIDATION_ERROR, error);
                return;
            }

            const userExists = await isUserEmailExist(value.email)
            if (userExists) {
                render(res, 200, statuscodes.USER_ALREADY_EXISTS, {});
                return;
            }

            const isExist = await isEmailExist(value.email)
            if(isExist) {
                render(res, 200, statuscodes.WAITLIST_EXISTS, {});
                return;
            }

            const user = await findOneByEmail(value.email)
            let waitlist = await createWaitlist({...value, status: WaitlistType.NOT_INVITED})

            // await mailchimpContactsService.createWaitlistContact(normalizeEmail(value.email));
            await mailchimpEmailService.sendWaitlistEmail(value.email);

            render(res, 200, statuscodes.OK, waitlist)
        } catch (e) {
            console.log(e)
            render(res, 400, statuscodes.BAD_REQUEST, {});
        }
    },

    checkWaitList: async (req, res) => {
        try {

            const schema = Joi.object({
                email : Joi.string().required().email(),
                languageId : Joi.number().optional()
            });

            const {error, value} = schema.validate(req.body);
            if (error) {
                render(res, 400, statuscodes.VALIDATION_ERROR, error);
                return;
            }
            
            const userExists = await isUserEmailExist(value.email)
            if (userExists) {
                render(res, 200, statuscodes.USER_ALREADY_EXISTS, {});
                return;
            }

            const waitlistExist = await isEmailExist(value.email)
            if (waitlistExist) {
                render(res, 200, statuscodes.WAITLIST_EXISTS, {});
                return;
            }
            
            const available = await getAllTrialing()
            if(!available) {
                render(res, 400, statuscodes.NOT_ALLOWED, {
                    url : null,
                })
                return;
            } else {
                const createOnWaitlist = await create7DaysTrial(value.email)
                let locale = 'en'; 
                if(value.languageId) {
                    const { iso } = await getLanguagesById(value.languageId)
                    locale = iso
                }
                const stripeUrl = await createFreeTrialSessionUrl(value.email, locale)
                render(res, 200, statuscodes.OK, {
                    url : stripeUrl || null
                })
                return;
            }
        } catch (e) {
            console.log(e)
            console.log(e.stack)
            render(res, 400, statuscodes.BAD_REQUEST, {});
        }
    }
};

module.exports = waitlistController